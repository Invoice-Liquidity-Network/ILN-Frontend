import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rpc } from '@stellar/stellar-sdk';
import {
  castVote,
  clearGovernanceIdempotencyCache,
  createProposal,
  decodeGovernanceEvent,
  fetchProposal,
  fetchQuorumThreshold,
  getVotingPower,
  type CreateProposalPayload,
} from '../governance';
import { sep10Session } from '@/lib/sep10Session';

const SIGNER = 'GBZXN7PIRZGNMHGA728RGRTDGBLTYNGHXMH2Y7QGE2FMQ3GVFCYX2O64';
const signTx = vi.fn(async (xdr: string) => `signed-${xdr}`);

const payload: CreateProposalPayload = {
  formType: 'FeeRate',
  title: 'Safety fixture proposal',
  description: 'Fixture used by the governance safety suite',
  newValueBps: 30,
};

beforeEach(() => {
  clearGovernanceIdempotencyCache();
  signTx.mockClear();
  sep10Session.setSession({
    token: 'test-token',
    accountId: SIGNER,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    homeDomain: 'example.com',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  sep10Session.clearSession();
});

describe('governance contract read fallbacks (#1069)', () => {
  it('returns 0 voting power when the RPC read fails', async () => {
    vi.spyOn(rpc.Server.prototype, 'simulateTransaction').mockRejectedValue(
      new Error('RPC unavailable')
    );

    await expect(getVotingPower(SIGNER)).resolves.toBe(0);
  });

  it('returns 0 quorum threshold when the RPC read fails', async () => {
    vi.spyOn(rpc.Server.prototype, 'simulateTransaction').mockRejectedValue(
      new Error('RPC unavailable')
    );

    await expect(fetchQuorumThreshold()).resolves.toBe(0);
  });
});

describe('governance duplicate-submit lock (#1068)', () => {
  it('collapses concurrent proposal submissions into one signature and one result', async () => {
    const before = (await fetchProposal(1))?.id;

    const [first, second] = await Promise.all([
      createProposal(payload, SIGNER, signTx),
      createProposal(payload, SIGNER, signTx),
    ]);

    expect(signTx).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(first.proposalId).toBeGreaterThan(before ?? 0);
  });

  it('collapses concurrent votes into one signature and one tally increment', async () => {
    const before = await fetchProposal(2);

    const [first, second] = await Promise.all([
      castVote(2, 'For', SIGNER, signTx),
      castVote(2, 'For', SIGNER, signTx),
    ]);

    expect(signTx).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);

    const after = await fetchProposal(2);
    expect(after?.votesFor).toBe((before?.votesFor ?? 0) + 1250);
  });
});

describe('governance network mismatch protection (#1067)', () => {
  const networkMismatch = vi.fn(async () => {
    throw new Error('Network mismatch. Please switch to TESTNET');
  });

  it('does not record a vote when the wallet network differs', async () => {
    const before = await fetchProposal(3);

    await expect(castVote(3, 'Against', SIGNER, networkMismatch)).rejects.toThrow(
      /network mismatch/i
    );
    expect(networkMismatch).toHaveBeenCalledTimes(1);

    const after = await fetchProposal(3);
    expect(after?.votesAgainst).toBe(before?.votesAgainst);
    expect(after?.userVote).toBeUndefined();
  });

  it('does not append a proposal when the wallet network differs', async () => {
    const before = await fetchProposal(1);

    await expect(createProposal(payload, SIGNER, networkMismatch)).rejects.toThrow(
      /network mismatch/i
    );
    expect(networkMismatch).toHaveBeenCalledTimes(1);
    expect((await fetchProposal(1))?.id).toBe(before?.id);
  });
});

describe('governance event decoding fixtures (#1066)', () => {
  it('decodes proposal, vote, veto and parameter events', () => {
    expect(
      decodeGovernanceEvent({
        topics: ['ProposalCreated', '9', SIGNER, 'Raise fee rate'],
      })
    ).toEqual({
      kind: 'proposal',
      proposalId: 9,
      proposer: SIGNER,
      title: 'Raise fee rate',
    });

    expect(decodeGovernanceEvent({ topics: ['VoteCast', '9', SIGNER, 'true', '1250'] })).toEqual({
      kind: 'vote',
      proposalId: 9,
      voter: SIGNER,
      support: true,
      weight: 1250,
    });

    expect(
      decodeGovernanceEvent({ topics: ['ProposalVetoed', '9', SIGNER, '0xdeadbeef'] })
    ).toEqual({
      kind: 'veto',
      proposalId: 9,
      admin: SIGNER,
      reasonHash: '0xdeadbeef',
    });

    expect(
      decodeGovernanceEvent({
        topics: ['ParameterUpdated', 'fee_rate_bps', '30', '9'],
      })
    ).toEqual({
      kind: 'parameter',
      proposalId: 9,
      parameter: 'fee_rate_bps',
      newValue: '30',
    });
  });

  it('decodes hex-encoded topics', () => {
    const hex = (value: string) =>
      Array.from(new TextEncoder().encode(value))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    expect(
      decodeGovernanceEvent({
        topics: [hex('VoteCast'), hex('4'), hex(SIGNER), hex('0'), hex('500')],
      })
    ).toEqual({
      kind: 'vote',
      proposalId: 4,
      voter: SIGNER,
      support: false,
      weight: 500,
    });
  });

  it('rejects malformed payloads instead of fabricating values', () => {
    expect(decodeGovernanceEvent({ topics: [] })).toBeNull();
    expect(decodeGovernanceEvent({ topics: ['UnknownEvent', '1'] })).toBeNull();
    expect(decodeGovernanceEvent({ topics: ['ProposalCreated', 'not-a-number'] })).toBeNull();
    expect(decodeGovernanceEvent({ topics: ['ProposalCreated', '1', SIGNER] })).toBeNull();
    expect(decodeGovernanceEvent({ topics: ['VoteCast', '1', SIGNER, 'maybe'] })).toBeNull();
    expect(decodeGovernanceEvent({ topics: ['ProposalVetoed', '1', SIGNER] })).toBeNull();
    expect(decodeGovernanceEvent({ topics: ['ParameterUpdated', '', '30', '1'] })).toBeNull();
    expect(
      decodeGovernanceEvent({ topics: ['ParameterUpdated', 'fee_rate_bps', '30'] })
    ).toBeNull();
  });
});
