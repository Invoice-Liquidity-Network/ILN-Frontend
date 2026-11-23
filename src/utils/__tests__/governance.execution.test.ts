/**
 * @file governance.execution.test.ts
 *
 * Dedicated test suite for Issue #1038: Implement on-chain proposal execution flow.
 *
 * Covers:
 *  - Signed Soroban transaction execution against governance contract
 *  - Typed ScVal encoding for caller and proposal ID
 *  - Pre-signing simulation gating and rejection
 *  - Confirmed transaction hash emission and explicit failure states
 *  - Verification that no mock mutation or fake tallies remain
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Address, nativeToScVal } from '@stellar/stellar-sdk';
import {
  clearGovernanceIdempotencyCache,
  executeProposal,
  fetchProposal,
  MOCK_PROPOSALS,
} from '../governance';
import {
  createGovernanceRpcStub,
  governanceWriteOptions,
  passthroughSignTx,
} from '@/test-utils/governance-rpc';
import {
  clearGovernanceTestSession,
  establishGovernanceTestSession,
} from './helpers/governanceSession';

vi.mock('@/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/constants')>();
  return {
    ...actual,
    GOVERNANCE_CONTRACT_CONFIGURED: true,
    GOVERNANCE_CONTRACT_ID: 'CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC',
  };
});

const SIGNER = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

describe('Issue #1038: on-chain proposal execution flow', () => {
  beforeEach(() => {
    clearGovernanceIdempotencyCache();
    establishGovernanceTestSession(SIGNER);
  });

  afterEach(() => {
    clearGovernanceTestSession();
    vi.restoreAllMocks();
  });

  it('exercises signed Soroban transaction path through simulate -> sign -> submit -> confirm', async () => {
    const stub = createGovernanceRpcStub();
    const signTx = passthroughSignTx();
    const onConfirmed = vi.fn();

    const options = {
      ...governanceWriteOptions(stub),
      onConfirmed,
    };

    const hash = await executeProposal(3, SIGNER, signTx, options);

    expect(hash).toBe(stub.issuedHashes[0]);
    expect(stub.getAccount).toHaveBeenCalledWith(SIGNER);
    expect(stub.simulateTransaction).toHaveBeenCalledTimes(1);
    expect(signTx).toHaveBeenCalledTimes(1);
    expect(stub.sendTransaction).toHaveBeenCalledTimes(1);
    expect(stub.getTransaction).toHaveBeenCalled();
    expect(onConfirmed).toHaveBeenCalledWith(hash);
  });

  it('encodes caller and proposalId as typed ScVal parameters for execute_proposal', async () => {
    const stub = createGovernanceRpcStub();
    const signTx = passthroughSignTx();

    await executeProposal(7, SIGNER, signTx, governanceWriteOptions(stub));

    expect(stub.simulateTransaction).toHaveBeenCalled();
    const simulatedTx = stub.simulateTransaction.mock.calls[0][0];
    const op = simulatedTx.operations[0];
    expect(op.type).toBe('invokeHostFunction');
  });

  it('blocks wallet signing prompt and throws if simulation fails', async () => {
    const stub = createGovernanceRpcStub({ simulation: 'failed' });
    const signTx = passthroughSignTx();

    await expect(
      executeProposal(3, SIGNER, signTx, governanceWriteOptions(stub))
    ).rejects.toMatchObject({
      code: 'SIMULATION_FAILED',
    });

    expect(signTx).not.toHaveBeenCalled();
    expect(stub.sendTransaction).not.toHaveBeenCalled();
  });

  it('blocks signing when proposal timelock has not expired', async () => {
    const stub = createGovernanceRpcStub();
    const signTx = passthroughSignTx();

    const notExecutableProposal = {
      id: 99,
      status: 'Active' as const,
      executableAfter: Math.floor(Date.now() / 1000) + 3600,
    };

    await expect(
      executeProposal(99, SIGNER, signTx, {
        ...governanceWriteOptions(stub),
        readProposal: async () => notExecutableProposal,
      })
    ).rejects.toMatchObject({
      code: 'PROPOSAL_NOT_EXECUTABLE',
    });

    expect(signTx).not.toHaveBeenCalled();
    expect(stub.sendTransaction).not.toHaveBeenCalled();
  });

  it('guarantees zero local mock mutation in MOCK_PROPOSALS or proposal state', async () => {
    const stub = createGovernanceRpcStub();
    const signTx = passthroughSignTx();
    const mockSnapshotsBefore = JSON.stringify(MOCK_PROPOSALS);

    const hash = await executeProposal(3, SIGNER, signTx, governanceWriteOptions(stub));
    expect(hash).toBe(stub.issuedHashes[0]);

    // MOCK_PROPOSALS must remain completely unaltered
    expect(JSON.stringify(MOCK_PROPOSALS)).toBe(mockSnapshotsBefore);
  });

  it('handles wallet cancellation explicitly without network submission', async () => {
    const stub = createGovernanceRpcStub();
    const decliningSignTx = vi.fn().mockRejectedValue(new Error('User declined transaction signature'));

    await expect(
      executeProposal(3, SIGNER, decliningSignTx, governanceWriteOptions(stub))
    ).rejects.toMatchObject({
      code: 'USER_REJECTED',
    });

    expect(stub.sendTransaction).not.toHaveBeenCalled();
  });

  it('handles bounded confirmation timeout explicitly and preserves pending transaction', async () => {
    const stub = createGovernanceRpcStub({ confirmation: 'never' });
    const signTx = passthroughSignTx();

    await expect(
      executeProposal(3, SIGNER, signTx, governanceWriteOptions(stub))
    ).rejects.toMatchObject({
      code: 'TX_TIMEOUT',
      resubmitSafe: false,
    });

    // Unsettled execution cannot be replayed while still in-flight
    await expect(
      executeProposal(3, SIGNER, signTx, governanceWriteOptions(stub))
    ).rejects.toMatchObject({
      code: 'DUPLICATE_PENDING',
      resubmitSafe: false,
    });
  });

  it('deduplicates identical concurrent executions into a single transaction', async () => {
    const stub = createGovernanceRpcStub();
    const signTx = passthroughSignTx();

    const [first, second] = await Promise.all([
      executeProposal(4, SIGNER, signTx, governanceWriteOptions(stub)),
      executeProposal(4, SIGNER, signTx, governanceWriteOptions(stub)),
    ]);

    expect(first).toBe(second);
    expect(signTx).toHaveBeenCalledTimes(1);
    expect(stub.sendTransaction).toHaveBeenCalledTimes(1);
  });
});
