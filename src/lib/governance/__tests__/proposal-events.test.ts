/**
 * Proposal list from governance contract events + query (#1040).
 */
import { describe, expect, it, vi } from 'vitest';
import { StrKey, type rpc } from '@stellar/stellar-sdk';
import {
  createProposalCreatedFixture,
  createProposalExecutedFixture,
  createProposalVetoedFixture,
  createVoteCastFixture,
} from '@/lib/governance/event-decoding';
import {
  loadProposalList,
  normalizeProposalRecords,
  ProposalLoadError,
} from '@/lib/governance/proposal-events';
import type { Proposal } from '@/utils/governance';

const CONTRACT = StrKey.encodeContract(Buffer.alloc(32, 7));
const PROPOSER = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const ADMIN = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 2));
const VOTER = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 3));

function proposal(id: number, overrides: Partial<Proposal> = {}): Proposal {
  return {
    id,
    title: `Proposal #${id}`,
    description: 'Description hash: 0xabc',
    type: 'ParameterUpdate',
    status: 'Active',
    proposer: PROPOSER,
    createdAt: 1_700_000_000,
    votingStartsAt: 1_700_000_000,
    votingEndsAt: 1_700_604_800,
    votesFor: 10,
    votesAgainst: 5,
    quorumRequired: 100,
    ...overrides,
  };
}

function eventsServer(
  events: rpc.Api.EventResponse[],
  overrides: Partial<{ getEvents: unknown; getLatestLedger: unknown }> = {}
) {
  return {
    getLatestLedger: vi.fn().mockResolvedValue({ sequence: 200_000 }),
    getEvents: vi.fn().mockResolvedValue({ events, latestLedger: 200_000, cursor: 'c' }),
    ...overrides,
  } as unknown as Pick<rpc.Server, 'getEvents' | 'getLatestLedger'>;
}

const parse = (native: unknown) => native as Proposal;

describe('normalizeProposalRecords', () => {
  it('enriches query records with creation, veto, execution and vote events', () => {
    const records = normalizeProposalRecords(
      [proposal(2), proposal(1, { status: 'Vetoed' })],
      [
        {
          kind: 'proposal_created',
          proposalId: 1,
          proposer: PROPOSER,
          actionType: 'UpdateFeeRate',
          title: 'Lower the fee',
          ledger: 900,
          txHash: 'c1',
          timestamp: 1,
        },
        {
          kind: 'proposal_vetoed',
          proposalId: 1,
          admin: ADMIN,
          reasonHash: '0xreason',
          ledger: 950,
          txHash: 'v1',
          timestamp: 50,
        },
        {
          kind: 'vote_cast',
          proposalId: 2,
          voter: VOTER,
          choice: 'For',
          votingPower: 10n,
          ledger: 960,
          txHash: 'vc',
          timestamp: 60,
        },
        {
          kind: 'proposal_executed',
          proposalId: 2,
          actionType: 'UpdateFeeRate',
          proposedValue: 30n,
          votesFor: 10n,
          votesAgainst: 5n,
          ledger: 970,
          txHash: 'e2',
          timestamp: 70,
        },
      ]
    );

    expect(records.map((r) => r.id)).toEqual([1, 2]);
    expect(records[0]).toMatchObject({
      title: 'Lower the fee',
      status: 'Vetoed',
      createdTxHash: 'c1',
      createdLedger: 900,
      vetoHistory: [{ proposalId: 1, admin: ADMIN, reasonHash: '0xreason', createdAt: 50 }],
    });
    expect(records[1]).toMatchObject({ executedTxHash: 'e2', confirmedVoteEvents: 1 });
  });

  it('keeps tallies and status from the query, never from events', () => {
    const [record] = normalizeProposalRecords(
      [proposal(1, { votesFor: 10, status: 'Active' })],
      [
        {
          kind: 'vote_cast',
          proposalId: 1,
          voter: VOTER,
          choice: 'For',
          votingPower: 999n,
          ledger: 1,
          txHash: 'x',
          timestamp: 1,
        },
      ]
    );
    expect(record.votesFor).toBe(10);
    expect(record.status).toBe('Active');
  });

  it('reports a created proposal missing from list_proposals as inconsistent', () => {
    expect(() =>
      normalizeProposalRecords(
        [proposal(1)],
        [
          {
            kind: 'proposal_created',
            proposalId: 9,
            proposer: PROPOSER,
            actionType: 'UpdateFeeRate',
            ledger: 1,
            txHash: 'c9',
            timestamp: 1,
          },
        ]
      )
    ).toThrow(expect.objectContaining({ code: 'PROPOSAL_STATE_INCONSISTENT' }));
  });

  it('rejects duplicate proposal ids from the query', () => {
    expect(() => normalizeProposalRecords([proposal(1), proposal(1)], [])).toThrow(
      expect.objectContaining({ code: 'PROPOSAL_RECORD_INVALID' })
    );
  });
});

describe('loadProposalList', () => {
  it('reads events before the query and returns normalized records', async () => {
    const order: string[] = [];
    const events = [
      createProposalCreatedFixture(CONTRACT, 1, PROPOSER, 'UpdateFeeRate', {
        ledger: 199_000,
        txHash: 'ab'.repeat(32),
      }),
      createProposalVetoedFixture(CONTRACT, 1, ADMIN, '0xreason', { ledger: 199_100 }),
      createVoteCastFixture(CONTRACT, 1, VOTER, 'Against', 25, { ledger: 199_050 }),
      createProposalExecutedFixture(CONTRACT, 1),
    ];
    const server = eventsServer([], {
      getEvents: vi.fn(async () => {
        order.push('events');
        return { events, latestLedger: 200_000, cursor: 'c' };
      }),
    });
    const queryProposals = vi.fn(async () => {
      order.push('query');
      return [proposal(1)];
    });

    const result = await loadProposalList({
      server,
      governanceContractId: CONTRACT,
      queryProposals,
      parseProposal: parse,
    });

    expect(order).toEqual(['events', 'query']);
    expect(result.scannedToLedger).toBe(200_000);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]).toMatchObject({
      id: 1,
      title: 'Test Proposal Title',
      createdTxHash: 'ab'.repeat(32),
      createdLedger: 199_000,
      confirmedVoteEvents: 1,
    });
    expect(result.proposals[0].vetoHistory?.[0]).toMatchObject({
      admin: ADMIN,
      reasonHash: '0xreason',
    });

    const filters = (server.getEvents as ReturnType<typeof vi.fn>).mock.calls[0][0].filters;
    expect(filters[0].contractIds).toEqual([CONTRACT]);
  });

  it('ignores events from failed contract calls', async () => {
    const failed = {
      ...createProposalCreatedFixture(CONTRACT, 5, PROPOSER),
      inSuccessfulContractCall: false,
    } as rpc.Api.EventResponse;
    const result = await loadProposalList({
      server: eventsServer([failed]),
      governanceContractId: CONTRACT,
      queryProposals: async () => [],
      parseProposal: parse,
    });
    expect(result.proposals).toEqual([]);
  });

  it('returns an empty list when the contract has no proposals', async () => {
    const result = await loadProposalList({
      server: eventsServer([]),
      governanceContractId: CONTRACT,
      queryProposals: async () => [],
      parseProposal: parse,
    });
    expect(result.proposals).toEqual([]);
  });

  it('rescans from the oldest retained ledger when the lookback exceeds retention', async () => {
    const getEvents = vi
      .fn()
      .mockRejectedValueOnce(
        new Error('startLedger must be between the oldest ledger: 150000 and 200000')
      )
      .mockResolvedValueOnce({ events: [], latestLedger: 200_000, cursor: 'c' });
    const result = await loadProposalList({
      server: eventsServer([], { getEvents }),
      governanceContractId: CONTRACT,
      queryProposals: async () => [proposal(1)],
      parseProposal: parse,
    });
    expect(result.scannedFromLedger).toBe(150_000);
    expect(getEvents.mock.calls[1][0].startLedger).toBe(150_000);
  });

  it('fails with PROPOSAL_EVENTS_UNAVAILABLE and skips the query when RPC events fail', async () => {
    const queryProposals = vi.fn(async () => [proposal(1)]);
    await expect(
      loadProposalList({
        server: eventsServer([], { getEvents: vi.fn().mockRejectedValue(new Error('offline')) }),
        governanceContractId: CONTRACT,
        queryProposals,
        parseProposal: parse,
      })
    ).rejects.toMatchObject({ code: 'PROPOSAL_EVENTS_UNAVAILABLE' });
    expect(queryProposals).not.toHaveBeenCalled();
  });

  it('fails with PROPOSAL_EVENTS_UNAVAILABLE when the latest ledger cannot be read', async () => {
    await expect(
      loadProposalList({
        server: eventsServer([], { getLatestLedger: vi.fn().mockRejectedValue(new Error('down')) }),
        governanceContractId: CONTRACT,
        queryProposals: async () => [],
        parseProposal: parse,
      })
    ).rejects.toBeInstanceOf(ProposalLoadError);
  });

  it('fails with PROPOSAL_QUERY_UNAVAILABLE when list_proposals cannot be read', async () => {
    await expect(
      loadProposalList({
        server: eventsServer([]),
        governanceContractId: CONTRACT,
        queryProposals: async () => {
          throw new Error('simulation failed');
        },
        parseProposal: parse,
      })
    ).rejects.toMatchObject({ code: 'PROPOSAL_QUERY_UNAVAILABLE' });
  });

  it('fails with PROPOSAL_RECORD_INVALID when a record cannot be parsed', async () => {
    await expect(
      loadProposalList({
        server: eventsServer([]),
        governanceContractId: CONTRACT,
        queryProposals: async () => [{ bogus: true }],
        parseProposal: () => {
          throw new Error('bad record');
        },
      })
    ).rejects.toMatchObject({ code: 'PROPOSAL_RECORD_INVALID' });
  });
});
