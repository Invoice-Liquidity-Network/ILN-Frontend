import { describe, expect, it, vi } from 'vitest';
import {
  pollGovernanceConfirmation,
  GovernanceTxTimeoutError,
  GovernanceTxFailedError,
} from '../governanceConfirmation';

describe('Governance Transaction Confirmation Timeout Handling (#1045)', () => {
  it('resolves CONFIRMED when transaction lands within timeout window', async () => {
    let callCount = 0;
    const checkStatus = vi.fn().mockImplementation(async () => {
      callCount += 1;
      if (callCount >= 2) {
        return { confirmed: true, ledger: 123456 };
      }
      return { confirmed: false };
    });

    const result = await pollGovernanceConfirmation('0xhash123', checkStatus, {
      timeoutMs: 5000,
      intervalMs: 10,
    });

    expect(result.status).toBe('CONFIRMED');
    expect(result.ledger).toBe(123456);
    expect(result.txHash).toBe('0xhash123');
  });

  it('resolves FAILED when transaction execution reverts on-chain', async () => {
    const checkStatus = vi.fn().mockResolvedValue({
      confirmed: false,
      failed: true,
      error: 'HostError: Error(Contract, #100)',
    });

    const result = await pollGovernanceConfirmation('0xhashFailed', checkStatus, {
      timeoutMs: 5000,
      intervalMs: 10,
    });

    expect(result.status).toBe('FAILED');
    expect(result.error).toContain('HostError');
  });

  it('resolves TIMEOUT when confirmation is not observed before deadline', async () => {
    const checkStatus = vi.fn().mockResolvedValue({ confirmed: false });

    const result = await pollGovernanceConfirmation('0xhashPending', checkStatus, {
      timeoutMs: 50,
      intervalMs: 10,
    });

    expect(result.status).toBe('TIMEOUT');
    expect(result.error).toContain('Confirmation polling exceeded bounded limit of 50ms');
  });

  it('instantiates typed errors with full metadata', () => {
    const timeoutErr = new GovernanceTxTimeoutError('Timed out', '0xabc', 30000, 30000);
    expect(timeoutErr.code).toBe('TRANSACTION_TIMEOUT');
    expect(timeoutErr.txHash).toBe('0xabc');

    const failedErr = new GovernanceTxFailedError('Reverted', '0xdef', 'Out of gas');
    expect(failedErr.code).toBe('TRANSACTION_FAILED');
    expect(failedErr.reason).toBe('Out of gas');
  });
});
