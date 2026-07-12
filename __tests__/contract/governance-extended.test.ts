/**
 * Extended governance tests for previously uncovered functions:
 * - executeProposal, vetoProposal, getVetoHistory
 * - getDelegationInfo (all branches)
 * - lookupToken (all branches)
 * - createProposal (MaxDiscountRate, RemoveToken paths)
 * - fetchParameterUpdates
 * - fetchVotesForAddress
 * - timeRemaining (active proposal paths: days+hours, hours+mins, "Ended")
 * - getUserVote
 * - MOCK_PROPOSALS / MOCK_VOTES data
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  executeProposal,
  vetoProposal,
  getVetoHistory,
  getDelegationInfo,
  lookupToken,
  createProposal,
  fetchParameterUpdates,
  fetchVotesForAddress,
  timeRemaining,
  getUserVote,
  castVote,
  MOCK_PROPOSALS,
  MOCK_VOTES,
  type CreateProposalPayload,
  type Proposal,
} from '@/utils/governance';

const SIGNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const mockSignTx = vi.fn(async (_xdr: string) => 'signedXDR');

afterEach(() => {
  vi.useRealTimers();
});

describe('governance – executeProposal', () => {
  it('returns a transaction hash and sets status to Executed', async () => {
    vi.useFakeTimers();
    const proposalId = 6;
    const promise = executeProposal(proposalId, SIGNER, mockSignTx);
    vi.runAllTimers();
    const hash = await promise;
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    const proposal = MOCK_PROPOSALS.find((p) => p.id === proposalId);
    expect(proposal?.status).toBe('Executed');
  });

  it('handles non-existent proposal gracefully', async () => {
    vi.useFakeTimers();
    const promise = executeProposal(9999, SIGNER, mockSignTx);
    vi.runAllTimers();
    const hash = await promise;
    expect(typeof hash).toBe('string');
  });
});

describe('governance – vetoProposal', () => {
  it('sets proposal status to Vetoed and records veto history', async () => {
    vi.useFakeTimers();
    const proposalId = 1;
    const reasonHash = 'abc123reasonhash';
    const adminAddress = 'GADMIN_ADDRESS';
    const promise = vetoProposal(proposalId, reasonHash, adminAddress, mockSignTx);
    vi.runAllTimers();
    const hash = await promise;

    expect(typeof hash).toBe('string');
    const proposal = MOCK_PROPOSALS.find((p) => p.id === proposalId);
    expect(proposal?.status).toBe('Vetoed');
    expect(proposal?.vetoHistory).toBeDefined();
    expect(proposal!.vetoHistory!.length).toBeGreaterThan(0);
    expect(proposal!.vetoHistory![0].admin).toBe(adminAddress);
    expect(proposal!.vetoHistory![0].reasonHash).toBe(reasonHash);
  });

  it('throws for non-existent proposal', async () => {
    vi.useFakeTimers();
    const promise = vetoProposal(99999, 'reason', 'GADMIN', mockSignTx);
    vi.runAllTimers();
    await expect(promise).rejects.toThrow('Proposal not found');
  });
});

describe('governance – getVetoHistory', () => {
  it('returns veto records for a given proposal', () => {
    // The veto from the previous test should be here
    const history = getVetoHistory(1);
    expect(Array.isArray(history)).toBe(true);
  });

  it('returns empty array for proposals with no vetoes', () => {
    const history = getVetoHistory(9999);
    expect(history).toEqual([]);
  });
});

describe('governance – getDelegationInfo', () => {
  it('returns delegation data for known address GABC123', async () => {
    vi.useFakeTimers();
    const promise = getDelegationInfo('GABC123');
    vi.runAllTimers();
    const info = await promise;

    expect(info.delegatedTo).toBe('GDEF456EXAMPLE789ABC012GHI345JKL678MNO901PQR234STU567VWX890YZ');
    expect(info.delegatedAmount).toBe(500);
    expect(info.incomingDelegations).toBe(0);
  });

  it('returns delegation data for known address GDEF456', async () => {
    vi.useFakeTimers();
    const promise = getDelegationInfo('GDEF456');
    vi.runAllTimers();
    const info = await promise;

    expect(info.delegatedTo).toBeNull();
    expect(info.delegatedAmount).toBe(0);
    expect(info.incomingDelegations).toBe(1200);
  });

  it('returns default delegation for unknown address', async () => {
    vi.useFakeTimers();
    const promise = getDelegationInfo('GUNKNOWN_ADDRESS_EXAMPLE');
    vi.runAllTimers();
    const info = await promise;

    expect(info.delegatedTo).toBeNull();
    expect(info.delegatedAmount).toBe(0);
    expect(typeof info.incomingDelegations).toBe('number');
  });
});

describe('governance – lookupToken', () => {
  it('rejects invalid Stellar address', async () => {
    await expect(lookupToken('invalid-address')).rejects.toThrow('Invalid Stellar address');
  });

  it('rejects empty string', async () => {
    await expect(lookupToken('')).rejects.toThrow('Invalid Stellar address');
  });

  it('rejects address that does not start with G', async () => {
    await expect(
      lookupToken('CABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCD')
    ).rejects.toThrow('Invalid Stellar address');
  });

  it('returns Unknown Token for valid G-address not in known set', async () => {
    vi.useFakeTimers();
    // Valid G-address (G + 55 base32 chars) not in accepted or known tokens
    const promise = lookupToken('GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBVN');
    vi.runAllTimers();
    const token = await promise;
    expect(token.name).toBe('Unknown Token');
  });
});

describe('governance – createProposal extended paths', () => {
  it('creates a MaxDiscountRate proposal', async () => {
    vi.useFakeTimers();
    const payload: CreateProposalPayload = {
      formType: 'MaxDiscountRate',
      title: 'Lower max discount',
      description: 'Reduce max discount rate to 4%',
      newValueBps: 400,
    };
    const promise = createProposal(payload, SIGNER, mockSignTx);
    vi.runAllTimers();
    const result = await promise;

    expect(result.proposalId).toBeGreaterThan(0);
    const created = MOCK_PROPOSALS.find((p) => p.id === result.proposalId);
    expect(created?.parameterChanges).toBeDefined();
    expect(created?.parameterChanges?.[0].parameter).toBe('max_discount_rate_bps');
  });

  it('creates a RemoveToken proposal', async () => {
    vi.useFakeTimers();
    const payload: CreateProposalPayload = {
      formType: 'RemoveToken',
      title: 'Remove EURC',
      description: 'Remove EURC from accepted tokens',
      removeTokenAddress: 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV',
    };
    const promise = createProposal(payload, SIGNER, mockSignTx);
    vi.runAllTimers();
    const result = await promise;

    expect(result.proposalId).toBeGreaterThan(0);
    const created = MOCK_PROPOSALS.find((p) => p.id === result.proposalId);
    expect(created?.parameterChanges).toBeDefined();
    expect(created?.parameterChanges?.[0].parameter).toBe('accepted_tokens');
    expect(created?.parameterChanges?.[0].newValue).toContain('removes EURC');
  });

  it('creates a RemoveToken proposal for non-existing token', async () => {
    vi.useFakeTimers();
    const payload: CreateProposalPayload = {
      formType: 'RemoveToken',
      title: 'Remove Unknown',
      description: 'Remove token not in list',
      removeTokenAddress: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    };
    const promise = createProposal(payload, SIGNER, mockSignTx);
    vi.runAllTimers();
    const result = await promise;

    const created = MOCK_PROPOSALS.find((p) => p.id === result.proposalId);
    expect(created?.parameterChanges?.[0].newValue).not.toContain('removes');
  });
});

describe('governance – fetchParameterUpdates', () => {
  it('returns parameter updates from executed proposals', async () => {
    vi.useFakeTimers();
    const promise = fetchParameterUpdates();
    vi.runAllTimers();
    const updates = await promise;

    expect(Array.isArray(updates)).toBe(true);
    // Should contain updates from executed proposals (4, 7)
    for (const update of updates) {
      expect(update).toHaveProperty('id');
      expect(update).toHaveProperty('proposalId');
      expect(update).toHaveProperty('parameter');
      expect(update).toHaveProperty('label');
      expect(update).toHaveProperty('newValue');
      expect(update).toHaveProperty('updatedAt');
    }
  });

  it('updates are sorted newest first', async () => {
    vi.useFakeTimers();
    const promise = fetchParameterUpdates();
    vi.runAllTimers();
    const updates = await promise;

    for (let i = 1; i < updates.length; i++) {
      expect(updates[i - 1].updatedAt).toBeGreaterThanOrEqual(updates[i].updatedAt);
    }
  });
});

describe('governance – fetchVotesForAddress', () => {
  it('returns votes for known mock voter', async () => {
    vi.useFakeTimers();
    const promise = fetchVotesForAddress(
      'GABC123EXAMPLE456789ABC012GHI345JKL678MNO901PQR234STU567VWX890YZ'
    );
    vi.runAllTimers();
    const votes = await promise;

    expect(Array.isArray(votes)).toBe(true);
    expect(votes.length).toBeGreaterThan(0);
    // Should be sorted by timestamp descending
    for (let i = 1; i < votes.length; i++) {
      expect(votes[i - 1].timestamp).toBeGreaterThanOrEqual(votes[i].timestamp);
    }
  });

  it('returns empty array for unknown address', async () => {
    vi.useFakeTimers();
    const promise = fetchVotesForAddress('GUNKNOWN_ADDRESS');
    vi.runAllTimers();
    const votes = await promise;
    expect(votes).toEqual([]);
  });
});

describe('governance – timeRemaining active paths', () => {
  it("returns 'Ended' for active proposal with past end time", () => {
    const now = Math.floor(Date.now() / 1000);
    const proposal: Proposal = {
      id: 100,
      title: 'Test',
      description: 'Test',
      type: 'ParameterUpdate',
      status: 'Active',
      proposer: 'G...',
      createdAt: now - 86400 * 10,
      votingStartsAt: now - 86400 * 10,
      votingEndsAt: now - 1, // ended 1 second ago
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 100_000,
    };
    expect(timeRemaining(proposal)).toBe('Ended');
  });

  it('returns days and hours for active proposal with >1 day remaining', () => {
    const now = Math.floor(Date.now() / 1000);
    const proposal: Proposal = {
      id: 101,
      title: 'Test',
      description: 'Test',
      type: 'ParameterUpdate',
      status: 'Active',
      proposer: 'G...',
      createdAt: now - 86400,
      votingStartsAt: now - 86400,
      votingEndsAt: now + 86400 * 3 + 3600 * 5, // 3 days 5 hours from now
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 100_000,
    };
    const result = timeRemaining(proposal);
    expect(result).toMatch(/\d+d \d+h remaining/);
  });

  it('returns hours and minutes for active proposal with <1 day remaining', () => {
    const now = Math.floor(Date.now() / 1000);
    const proposal: Proposal = {
      id: 102,
      title: 'Test',
      description: 'Test',
      type: 'ParameterUpdate',
      status: 'Active',
      proposer: 'G...',
      createdAt: now - 86400,
      votingStartsAt: now - 86400,
      votingEndsAt: now + 3600 * 5 + 60 * 30, // 5 hours 30 minutes from now
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 100_000,
    };
    const result = timeRemaining(proposal);
    expect(result).toMatch(/\d+h \d+m remaining/);
  });

  it('returns empty string for Failed proposals', () => {
    const now = Math.floor(Date.now() / 1000);
    const proposal: Proposal = {
      id: 103,
      title: 'Test',
      description: 'Test',
      type: 'ParameterUpdate',
      status: 'Failed',
      proposer: 'G...',
      createdAt: now - 86400,
      votingStartsAt: now - 86400,
      votingEndsAt: now + 86400,
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      quorumRequired: 100_000,
    };
    expect(timeRemaining(proposal)).toBe('');
  });
});

describe('governance – getUserVote', () => {
  it('returns undefined for proposals not voted on', () => {
    expect(getUserVote(99999)).toBeUndefined();
  });

  it('returns the vote choice after casting', async () => {
    vi.useFakeTimers();
    const promise = castVote(5, 'Abstain', SIGNER, mockSignTx);
    vi.runAllTimers();
    await promise;
    expect(getUserVote(5)).toBe('Abstain');
  });
});

describe('governance – MOCK_VOTES', () => {
  it('contains vote cast events with required fields', () => {
    expect(Array.isArray(MOCK_VOTES)).toBe(true);
    for (const vote of MOCK_VOTES) {
      expect(vote).toHaveProperty('proposalId');
      expect(vote).toHaveProperty('proposalTitle');
      expect(vote).toHaveProperty('voter');
      expect(vote).toHaveProperty('vote');
      expect(vote).toHaveProperty('weight');
      expect(vote).toHaveProperty('timestamp');
    }
  });
});
