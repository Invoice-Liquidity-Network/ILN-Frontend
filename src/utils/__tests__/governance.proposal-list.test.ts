/**
 * fetchProposals loads from governance contract events + list_proposals (#1040).
 * No production read path consumes MOCK_PROPOSALS.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nativeToScVal, rpc, StrKey } from '@stellar/stellar-sdk';

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/constants')>()),
  GOVERNANCE_CONTRACT_ID: 'CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC',
  ILN_TOKEN_CONTRACT_ID: 'CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC',
  NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  STELLAR_NETWORK: 'testnet',
}));

import { createProposalCreatedFixture } from '@/lib/governance/event-decoding';
import { fetchProposal, fetchProposals, GovernanceReadError, MOCK_PROPOSALS } from '../governance';

const CONTRACT = 'CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC';
const PROPOSER = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 9));

function listRetval(ids: number[]) {
  return {
    transactionData: {},
    result: {
      retval: nativeToScVal(
        ids.map((id) => ({
          id: BigInt(id),
          action_type: { UpdateFeeRate: [30] },
          status: { Active: [] },
          proposer: PROPOSER,
          created_at: 1_700_000_000n,
          voting_end: 1_700_604_800n,
          votes_for: 40n,
          votes_against: 2n,
        }))
      ),
    },
  } as never;
}

let simulate: ReturnType<typeof vi.spyOn>;
let getEvents: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.spyOn(rpc.Server.prototype, 'getLatestLedger').mockResolvedValue({
    sequence: 500_000,
  } as never);
  getEvents = vi
    .spyOn(rpc.Server.prototype, 'getEvents')
    .mockResolvedValue({ events: [], latestLedger: 500_000, cursor: 'c' } as never);
  simulate = vi.spyOn(rpc.Server.prototype, 'simulateTransaction');
});

afterEach(() => vi.restoreAllMocks());

describe('fetchProposals (#1040)', () => {
  it('returns chain records enriched with the proposal_created event', async () => {
    getEvents.mockResolvedValue({
      events: [
        createProposalCreatedFixture(CONTRACT, 3, PROPOSER, 'UpdateFeeRate', {
          ledger: 499_000,
          txHash: 'cd'.repeat(32),
        }),
      ],
      latestLedger: 500_000,
      cursor: 'c',
    } as never);
    simulate.mockResolvedValue(listRetval([3]));

    const proposals = await fetchProposals();

    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      id: 3,
      title: 'Test Proposal Title',
      status: 'Active',
      votesFor: 40,
      votesAgainst: 2,
      createdTxHash: 'cd'.repeat(32),
    });
    expect(getEvents).toHaveBeenCalledOnce();
    expect(simulate).toHaveBeenCalledOnce();
  });

  it('returns an empty list, not fixtures, when the contract has no proposals', async () => {
    simulate.mockResolvedValue(listRetval([]));
    await expect(fetchProposals()).resolves.toEqual([]);
  });

  it('ignores a mock-fallback request and fails closed on RPC errors', async () => {
    simulate.mockRejectedValue(new Error('offline'));
    const err = await fetchProposals({ allowMockFallback: true }).catch((e) => e);
    expect(err).toBeInstanceOf(GovernanceReadError);
    expect(err).toMatchObject({
      code: 'GOVERNANCE_READ_UNAVAILABLE',
      reason: 'PROPOSAL_QUERY_UNAVAILABLE',
    });
  });

  it('reports unavailable events with a typed reason', async () => {
    getEvents.mockRejectedValue(new Error('rpc down'));
    await expect(fetchProposals()).rejects.toMatchObject({
      code: 'GOVERNANCE_READ_UNAVAILABLE',
      reason: 'PROPOSAL_EVENTS_UNAVAILABLE',
    });
    expect(simulate).not.toHaveBeenCalled();
  });

  it('reports a created event missing from list_proposals as inconsistent', async () => {
    getEvents.mockResolvedValue({
      events: [createProposalCreatedFixture(CONTRACT, 8, PROPOSER)],
      latestLedger: 500_000,
      cursor: 'c',
    } as never);
    simulate.mockResolvedValue(listRetval([1]));
    await expect(fetchProposals()).rejects.toMatchObject({
      reason: 'PROPOSAL_STATE_INCONSISTENT',
    });
  });

  it('fetchProposal returns null for an id the chain does not know', async () => {
    simulate.mockResolvedValue(listRetval([1]));
    await expect(fetchProposal(MOCK_PROPOSALS[0].id + 1000)).resolves.toBeNull();
  });

  it('never surfaces or mutates MOCK_PROPOSALS', async () => {
    const snapshot = JSON.stringify(MOCK_PROPOSALS);
    simulate.mockResolvedValue(listRetval([1]));
    const proposals = await fetchProposals();
    expect(proposals.map((p) => p.title)).not.toContain(MOCK_PROPOSALS[0].title);
    expect(JSON.stringify(MOCK_PROPOSALS)).toBe(snapshot);
  });

  it('has no production read of MOCK_PROPOSALS in governance.ts', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/utils/governance.ts'), 'utf8');
    const reads = source
      .split('\n')
      .filter(
        (line) =>
          line.includes('MOCK_PROPOSALS') && !/^\s*(\/\/|\*|export const MOCK_PROPOSALS)/.test(line)
      );
    expect(reads).toEqual([]);
  });
});
