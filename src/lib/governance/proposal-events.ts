/**
 * Proposal list loaded from governance contract events + query (#1040).
 *
 * The proposal list is built only from chain-backed sources:
 *
 *  1. **Events** — confirmed `proposal_created`, `proposal_vetoed`,
 *     `proposal_executed` and `vote_cast` events emitted by the governance
 *     contract, read through Soroban RPC `getEvents`.
 *  2. **Query** — the contract's `list_proposals` view, read by simulation.
 *
 * Events are read *before* the query, so any proposal the events announce
 * must already be present in the query result. A proposal that appears in a
 * confirmed `proposal_created` event but not in `list_proposals` is reported
 * as {@link ProposalLoadError} (`PROPOSAL_STATE_INCONSISTENT`) instead of
 * being dropped or fabricated.
 *
 * There is no mock or fixture fallback: any RPC failure surfaces as a typed
 * {@link ProposalLoadError}, which callers render as an explicit failure state.
 *
 * Soroban RPC retains events for a limited window. Proposals created before
 * that window still come from the query; they simply carry no event
 * provenance (`createdTxHash` / `createdLedger` are `undefined`).
 */

import { nativeToScVal, type rpc } from '@stellar/stellar-sdk';
import {
  decodeGovernanceEvent,
  type DecodedGovernanceEvent,
} from '@/lib/governance/event-decoding';
import type { Proposal, VetoRecord } from '@/utils/governance';

/** ~7 days of ledgers at ~5s per ledger: the public RPC retention window. */
export const PROPOSAL_EVENTS_LOOKBACK_LEDGERS = 120_960;
const PAGE_LIMIT = 200;
const MAX_PAGES = 20;

const PROPOSAL_EVENT_TOPICS = [
  'proposal_created',
  'proposal_vetoed',
  'proposal_executed',
  'vote_cast',
] as const;

export type ProposalLoadErrorCode =
  | 'PROPOSAL_EVENTS_UNAVAILABLE'
  | 'PROPOSAL_QUERY_UNAVAILABLE'
  | 'PROPOSAL_RECORD_INVALID'
  | 'PROPOSAL_STATE_INCONSISTENT';

export class ProposalLoadError extends Error {
  constructor(
    readonly code: ProposalLoadErrorCode,
    detail: string,
    options?: { cause?: unknown }
  ) {
    super(`${code}: ${detail}`, options);
    this.name = 'ProposalLoadError';
  }
}

/** A proposal normalized from the query and enriched with event provenance. */
export interface ProposalRecord extends Proposal {
  /** Hash of the transaction that emitted `proposal_created`, when retained. */
  createdTxHash?: string;
  /** Ledger that confirmed `proposal_created`, when retained. */
  createdLedger?: number;
  /** Hash of the transaction that executed the proposal, when retained. */
  executedTxHash?: string;
  /** Number of confirmed `vote_cast` events seen for this proposal. */
  confirmedVoteEvents: number;
}

export interface ProposalListResult {
  proposals: ProposalRecord[];
  /** Ledger range scanned for events, after clamping to RPC retention. */
  scannedFromLedger: number;
  scannedToLedger: number;
}

type EventsServer = Pick<rpc.Server, 'getEvents' | 'getLatestLedger'>;

export interface LoadProposalListOptions {
  server: EventsServer;
  governanceContractId: string;
  /** Reads `list_proposals` from the contract; returns the native array. */
  queryProposals: () => Promise<unknown[]>;
  /** Normalizes one native contract record; throws on malformed data. */
  parseProposal: (native: unknown) => Proposal;
  lookbackLedgers?: number;
}

function symbolTopic(name: string): string {
  return nativeToScVal(name, { type: 'symbol' }).toXDR('base64');
}

function oldestLedgerFromError(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const match = message.match(/oldest ledger:?\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function proposalEventFilters(governanceContractId: string): rpc.Api.EventFilter[] {
  const created = symbolTopic('proposal_created');
  const vetoed = symbolTopic('proposal_vetoed');
  const executed = symbolTopic('proposal_executed');
  const voteCast = symbolTopic('vote_cast');
  return [
    {
      type: 'contract',
      contractIds: [governanceContractId],
      topics: [
        [created, '*', '*'],
        [vetoed, '*', '*'],
        [executed, '*'],
        [voteCast, '*', '*'],
      ],
    },
  ];
}

async function collectEvents(
  server: EventsServer,
  filters: rpc.Api.EventFilter[],
  startLedger: number
): Promise<{ events: rpc.Api.EventResponse[]; latestLedger: number }> {
  const events: rpc.Api.EventResponse[] = [];
  let response = await server.getEvents({ filters, startLedger, limit: PAGE_LIMIT });
  events.push(...response.events);
  for (let page = 1; page < MAX_PAGES && response.events.length === PAGE_LIMIT; page += 1) {
    response = await server.getEvents({ filters, cursor: response.cursor, limit: PAGE_LIMIT });
    events.push(...response.events);
  }
  return { events, latestLedger: response.latestLedger };
}

/**
 * Read and decode confirmed proposal lifecycle events. Events from failed
 * contract calls and malformed payloads are ignored; transport failures throw.
 */
export async function fetchProposalEvents(
  server: EventsServer,
  governanceContractId: string,
  lookbackLedgers = PROPOSAL_EVENTS_LOOKBACK_LEDGERS
): Promise<{
  events: DecodedGovernanceEvent[];
  scannedFromLedger: number;
  scannedToLedger: number;
}> {
  let latest: number;
  try {
    latest = (await server.getLatestLedger()).sequence;
  } catch (error) {
    throw new ProposalLoadError(
      'PROPOSAL_EVENTS_UNAVAILABLE',
      'Unable to read the latest ledger from RPC.',
      { cause: error }
    );
  }

  const filters = proposalEventFilters(governanceContractId);
  let startLedger = Math.max(1, latest - Math.max(1, Math.floor(lookbackLedgers)));
  let collected: { events: rpc.Api.EventResponse[]; latestLedger: number };
  try {
    collected = await collectEvents(server, filters, startLedger);
  } catch (error) {
    // The lookback reached past RPC retention: rescan once from the oldest
    // retained ledger and report the narrower window.
    const oldest = oldestLedgerFromError(error);
    if (oldest === null || oldest <= startLedger) {
      throw new ProposalLoadError(
        'PROPOSAL_EVENTS_UNAVAILABLE',
        'Unable to read governance contract events from RPC.',
        { cause: error }
      );
    }
    startLedger = oldest;
    try {
      collected = await collectEvents(server, filters, startLedger);
    } catch (retryError) {
      throw new ProposalLoadError(
        'PROPOSAL_EVENTS_UNAVAILABLE',
        'Unable to read governance contract events from RPC.',
        { cause: retryError }
      );
    }
  }

  const events: DecodedGovernanceEvent[] = [];
  for (const raw of collected.events) {
    if (raw.inSuccessfulContractCall === false) continue;
    const decoded = decodeGovernanceEvent(raw);
    if (decoded && (PROPOSAL_EVENT_TOPICS as readonly string[]).includes(decoded.kind)) {
      events.push(decoded);
    }
  }

  return { events, scannedFromLedger: startLedger, scannedToLedger: collected.latestLedger };
}

/**
 * Merge query records with decoded events into normalized proposal records.
 * Pure: exported for unit tests.
 */
export function normalizeProposalRecords(
  proposals: Proposal[],
  events: DecodedGovernanceEvent[]
): ProposalRecord[] {
  const byId = new Map<number, ProposalRecord>();
  for (const proposal of proposals) {
    if (byId.has(proposal.id)) {
      throw new ProposalLoadError(
        'PROPOSAL_RECORD_INVALID',
        `Governance contract returned proposal #${proposal.id} more than once.`
      );
    }
    byId.set(proposal.id, { ...proposal, confirmedVoteEvents: 0 });
  }

  const missing = new Set<number>();
  const vetoes = new Map<number, VetoRecord[]>();

  for (const event of events) {
    if (event.kind === 'parameter_updated') continue;
    const record = byId.get(event.proposalId);

    switch (event.kind) {
      case 'proposal_created':
        if (!record) {
          missing.add(event.proposalId);
          break;
        }
        record.createdTxHash = event.txHash || undefined;
        record.createdLedger = event.ledger || undefined;
        // The contract stores a description hash, not a title; the creation
        // event is the only chain source for the human-readable title.
        if (event.title && record.title === `Proposal #${record.id}`) {
          record.title = event.title;
        }
        if (!record.proposer && event.proposer) record.proposer = event.proposer;
        break;
      case 'proposal_executed':
        if (record) record.executedTxHash = event.txHash || undefined;
        break;
      case 'proposal_vetoed': {
        if (!record) break;
        const list = vetoes.get(event.proposalId) ?? [];
        list.push({
          proposalId: event.proposalId,
          admin: event.admin,
          reasonHash: event.reasonHash,
          createdAt: event.timestamp,
        });
        vetoes.set(event.proposalId, list);
        break;
      }
      case 'vote_cast':
        if (record) record.confirmedVoteEvents += 1;
        break;
    }
  }

  if (missing.size > 0) {
    const ids = [...missing].sort((a, b) => a - b).map((id) => `#${id}`);
    throw new ProposalLoadError(
      'PROPOSAL_STATE_INCONSISTENT',
      `Confirmed proposal_created events for ${ids.join(', ')} are missing from list_proposals.`
    );
  }

  for (const [id, list] of vetoes) {
    const record = byId.get(id);
    if (record) record.vetoHistory = list.sort((a, b) => b.createdAt - a.createdAt);
  }

  return [...byId.values()].sort((a, b) => a.id - b.id);
}

/**
 * Load the proposal list from governance contract events and the
 * `list_proposals` query. Throws {@link ProposalLoadError}; never falls back.
 */
export async function loadProposalList({
  server,
  governanceContractId,
  queryProposals,
  parseProposal,
  lookbackLedgers,
}: LoadProposalListOptions): Promise<ProposalListResult> {
  // Events first: the query that follows observes a ledger at least as new.
  const { events, scannedFromLedger, scannedToLedger } = await fetchProposalEvents(
    server,
    governanceContractId,
    lookbackLedgers
  );

  let natives: unknown[];
  try {
    natives = await queryProposals();
  } catch (error) {
    if (error instanceof ProposalLoadError) throw error;
    throw new ProposalLoadError(
      'PROPOSAL_QUERY_UNAVAILABLE',
      'Unable to read list_proposals from the governance contract.',
      { cause: error }
    );
  }

  let proposals: Proposal[];
  try {
    proposals = natives.map((native) => parseProposal(native));
  } catch (error) {
    throw new ProposalLoadError(
      'PROPOSAL_RECORD_INVALID',
      'Governance contract returned a malformed proposal record.',
      { cause: error }
    );
  }

  return {
    proposals: normalizeProposalRecords(proposals, events),
    scannedFromLedger,
    scannedToLedger,
  };
}
