import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  governanceAdapter,
  normalizeGovernanceError,
  GovernanceAdapterError,
} from '../governanceContractAdapter';
import { MissingSignerError } from '@/utils/governance';

describe('Centralized Governance Contract Adapter (#1059)', () => {
  it('normalizes MissingSignerError into GOV_MISSING_SIGNER with consistent code', () => {
    const rawError = new MissingSignerError('Signer missing');
    const normalized = normalizeGovernanceError(rawError);

    expect(normalized).toBeInstanceOf(GovernanceAdapterError);
    expect(normalized.code).toBe('GOV_MISSING_SIGNER');
    expect(normalized.message).toContain('MISSING_SIGNER');
  });

  it('normalizes user rejection error into GOV_SIGNATURE_REJECTED', () => {
    const rawError = new Error('USER_REJECTED: User denied signature');
    const normalized = normalizeGovernanceError(rawError);

    expect(normalized.code).toBe('GOV_SIGNATURE_REJECTED');
  });

  it('normalizes voting power error into GOV_VOTING_POWER_UNAVAILABLE', () => {
    const rawError = new Error('VOTING_POWER_UNAVAILABLE: Node failed');
    const normalized = normalizeGovernanceError(rawError);

    expect(normalized.code).toBe('GOV_VOTING_POWER_UNAVAILABLE');
  });

  it('catches and normalizes adapter.castVote failures on missing signer', async () => {
    const signTx = vi.fn();
    await expect(
      governanceAdapter.castVote(1, 'For', '', signTx),
    ).rejects.toThrow(GovernanceAdapterError);

    try {
      await governanceAdapter.castVote(1, 'For', '', signTx);
    } catch (err: any) {
      expect(err.code).toBe('GOV_MISSING_SIGNER');
    }
  });

  it('catches and normalizes adapter.executeProposal failures on missing signer', async () => {
    const signTx = vi.fn();
    await expect(
      governanceAdapter.executeProposal(1, '', signTx),
    ).rejects.toThrow(GovernanceAdapterError);
  });
});
