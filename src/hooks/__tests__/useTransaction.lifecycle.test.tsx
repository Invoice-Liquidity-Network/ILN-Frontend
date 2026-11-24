/**
 * Lifecycle tests for #1142 / #1143 / #1144 (`useTransaction`).
 *
 * - Cancellation resolves to `cancelled` with local UI state unchanged: no
 *   error escalation, no query invalidation, no success signal, no retry.
 * - Wrong-network blocks safely with no retry that could duplicate.
 * - A genuine failure keeps its error and offers exactly one retry.
 * - A second execute while one is in flight is ignored (no duplicates).
 */

import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTransaction } from '../useTransaction';
import { GovernanceTxError } from '@/lib/governance-tx';
import {
  canRetryLifecycleStatus,
  isInFlightLifecycleStatus,
  isTerminalLifecycleStatus,
  type TransactionLifecycleStatus,
} from '@/lib/transaction-lifecycle';

const invalidateQueriesMock = vi.fn();
const addToastMock = vi.fn(() => 'toast-id');
const updateToastMock = vi.fn();
const notifyTxSuccessMock = vi.fn();
const recordSigningAttemptMock = vi.fn();

vi.mock('@/context/WalletContext', () => ({ useWallet: vi.fn() }));
vi.mock('@/utils/soroban', () => ({ submitSignedTransaction: vi.fn() }));
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: addToastMock, updateToast: updateToastMock }),
}));
vi.mock('@/hooks/useTransactionPreview', () => ({
  useTransactionPreview: () => ({
    previewModal: null,
    requestPreview: vi.fn().mockResolvedValue(true),
  }),
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));
vi.mock('@/utils/txEvents', () => ({
  notifyTxSuccess: (...args: unknown[]) => notifyTxSuccessMock(...args),
}));
vi.mock('@/lib/signing-alert', () => ({
  recordSigningAttempt: (...args: unknown[]) => recordSigningAttemptMock(...args),
}));

import { useWallet } from '@/context/WalletContext';
import { submitSignedTransaction } from '@/utils/soroban';

const mockTx = {} as never;

function connectedWallet() {
  vi.mocked(useWallet).mockReturnValue({
    isConnected: true,
    address: 'GTEST',
    signTx: vi.fn(),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  connectedWallet();
});

describe('useTransaction lifecycle', () => {
  it('cancellation leaves local UI state unchanged', async () => {
    vi.mocked(submitSignedTransaction).mockRejectedValue(
      new Error('User rejected the transaction')
    );
    const { result } = renderHook(() => useTransaction());

    let outcome: unknown = 'pending';
    await act(async () => {
      outcome = await result.current.execute(mockTx);
    });

    expect(outcome).toBeNull();
    expect(result.current.lifecycleStatus).toBe('cancelled');
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
    expect(result.current.txHash).toBeNull();
    expect(invalidateQueriesMock).not.toHaveBeenCalled();
    expect(notifyTxSuccessMock).not.toHaveBeenCalled();
    expect(updateToastMock).toHaveBeenCalledWith(
      'toast-id',
      expect.objectContaining({ title: 'Transaction cancelled' })
    );
    const toastArg = updateToastMock.mock.calls[0][1] as { action?: unknown };
    expect(toastArg.action).toBeUndefined();
  });

  it('wrong-network blocks safely without offering retry', async () => {
    vi.mocked(submitSignedTransaction).mockRejectedValue(
      new Error('Network mismatch. Please switch to TESTNET')
    );
    const { result } = renderHook(() => useTransaction());

    await act(async () => {
      await result.current.execute(mockTx);
    });

    expect(result.current.lifecycleStatus).toBe('failed');
    expect(result.current.error).toContain('Network mismatch');
    expect(result.current.success).toBe(false);
    expect(invalidateQueriesMock).not.toHaveBeenCalled();
    const toastArg = updateToastMock.mock.calls[0][1] as { action?: unknown };
    expect(toastArg.action).toBeUndefined();
  });

  it('genuine failure keeps its error and offers a retry', async () => {
    vi.mocked(submitSignedTransaction).mockRejectedValue(new Error('Simulation failed'));
    const { result } = renderHook(() => useTransaction());

    await act(async () => {
      await result.current.execute(mockTx);
    });

    expect(result.current.lifecycleStatus).toBe('failed');
    expect(result.current.error).toMatch(/simulation failed/i);
    const toastArg = updateToastMock.mock.calls[0][1] as {
      action?: { label?: string };
    };
    expect(toastArg.action).toEqual(expect.objectContaining({ label: 'Retry' }));
  });

  it('ignores a second execute while one is in flight', async () => {
    let release!: (value: { txHash: string }) => void;
    vi.mocked(submitSignedTransaction).mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      })
    );
    const { result } = renderHook(() => useTransaction());

    let first: Promise<unknown>;
    act(() => {
      first = result.current.execute(mockTx);
    });
    let secondOutcome: unknown = 'pending';
    await act(async () => {
      secondOutcome = await result.current.execute(mockTx);
    });

    expect(secondOutcome).toBeNull();
    expect(vi.mocked(submitSignedTransaction)).toHaveBeenCalledTimes(1);

    await act(async () => {
      release({ txHash: 'settle-hash' });
      await first;
    });
    expect(result.current.lifecycleStatus).toBe('confirmed');
    expect(result.current.txHash).toBe('settle-hash');
    expect(invalidateQueriesMock).toHaveBeenCalledTimes(1);
  });

  describe('terminal state audit (#1288)', () => {
    it('advances monotonically through signed -> submitted -> confirming -> confirmed and ignores regressive callbacks', async () => {
      const observedStates: TransactionLifecycleStatus[] = [];
      let capturedOnStatus: ((stage: 'signed' | 'submitted' | 'confirming') => void) | undefined;
      let release!: (value: { txHash: string }) => void;

      vi.mocked(submitSignedTransaction).mockImplementation(
        ({ onStatus }: { onStatus?: (stage: 'signed' | 'submitted' | 'confirming') => void }) => {
          capturedOnStatus = onStatus;
          return new Promise((resolve) => {
            release = resolve;
          });
        }
      );

      const { result } = renderHook(() => useTransaction());
      expect(result.current.lifecycleStatus).toBe('unsigned');

      let txPromise!: Promise<unknown>;
      act(() => {
        txPromise = result.current.execute(mockTx);
      });

      act(() => {
        capturedOnStatus?.('signed');
      });
      observedStates.push(result.current.lifecycleStatus);
      expect(result.current.lifecycleStatus).toBe('signed');

      act(() => {
        capturedOnStatus?.('submitted');
      });
      observedStates.push(result.current.lifecycleStatus);
      expect(result.current.lifecycleStatus).toBe('submitted');

      // Regressive callback (submitted -> signed) must be ignored.
      act(() => {
        capturedOnStatus?.('signed');
      });
      expect(result.current.lifecycleStatus).toBe('submitted');

      act(() => {
        capturedOnStatus?.('confirming');
      });
      observedStates.push(result.current.lifecycleStatus);
      expect(result.current.lifecycleStatus).toBe('confirming');

      // Regressive callback (confirming -> submitted) must be ignored.
      act(() => {
        capturedOnStatus?.('submitted');
      });
      expect(result.current.lifecycleStatus).toBe('confirming');

      await act(async () => {
        release({ txHash: 'confirmed-hash' });
        await txPromise;
      });
      observedStates.push(result.current.lifecycleStatus);

      expect(observedStates).toEqual(['signed', 'submitted', 'confirming', 'confirmed']);
      expect(isTerminalLifecycleStatus(result.current.lifecycleStatus)).toBe(true);
      expect(canRetryLifecycleStatus(result.current.lifecycleStatus)).toBe(false);

      // Late out-of-order onStatus after terminal confirmed must not regress state.
      act(() => {
        capturedOnStatus?.('submitted');
        capturedOnStatus?.('confirming');
      });
      expect(result.current.lifecycleStatus).toBe('confirmed');
    });

    it('terminal failed state cannot regress on late status callbacks', async () => {
      let capturedOnStatus: ((stage: 'signed' | 'submitted' | 'confirming') => void) | undefined;
      vi.mocked(submitSignedTransaction).mockImplementation(
        ({ onStatus }: { onStatus?: (stage: 'signed' | 'submitted' | 'confirming') => void }) => {
          capturedOnStatus = onStatus;
          onStatus?.('signed');
          return Promise.reject(new Error('Ledger execution failed'));
        }
      );

      const { result } = renderHook(() => useTransaction());
      await act(async () => {
        await result.current.execute(mockTx);
      });

      expect(result.current.lifecycleStatus).toBe('failed');
      expect(isTerminalLifecycleStatus(result.current.lifecycleStatus)).toBe(true);
      expect(canRetryLifecycleStatus(result.current.lifecycleStatus)).toBe(true);

      act(() => {
        capturedOnStatus?.('submitted');
        capturedOnStatus?.('confirming');
      });
      expect(result.current.lifecycleStatus).toBe('failed');
    });

    it('terminal cancelled state cannot regress on late status callbacks and never offers retry', async () => {
      let capturedOnStatus: ((stage: 'signed' | 'submitted' | 'confirming') => void) | undefined;
      vi.mocked(submitSignedTransaction).mockImplementation(
        ({ onStatus }: { onStatus?: (stage: 'signed' | 'submitted' | 'confirming') => void }) => {
          capturedOnStatus = onStatus;
          return Promise.reject(new Error('User rejected the transaction'));
        }
      );

      const { result } = renderHook(() => useTransaction());
      await act(async () => {
        await result.current.execute(mockTx);
      });

      expect(result.current.lifecycleStatus).toBe('cancelled');
      expect(isTerminalLifecycleStatus(result.current.lifecycleStatus)).toBe(true);
      expect(canRetryLifecycleStatus(result.current.lifecycleStatus)).toBe(false);

      act(() => {
        capturedOnStatus?.('signed');
        capturedOnStatus?.('submitted');
        capturedOnStatus?.('confirming');
      });
      expect(result.current.lifecycleStatus).toBe('cancelled');
    });

    it('unknown outcome (TX_TIMEOUT) stays in confirming, omits retry, and blocks duplicate execute', async () => {
      const timeoutErr = new GovernanceTxError({
        code: 'TX_TIMEOUT',
        phase: 'confirm',
        message: 'Confirmation polling timed out',
        remediation: 'Check explorer before retrying',
        txHash: 'pending-timeout-hash',
        resubmitSafe: false,
      });

      const { result } = renderHook(() => useTransaction());
      await act(async () => {
        await result.current.execute(async () => {
          throw timeoutErr;
        });
      });

      expect(result.current.lifecycleStatus).toBe('confirming');
      expect(isInFlightLifecycleStatus(result.current.lifecycleStatus)).toBe(true);
      expect(isTerminalLifecycleStatus(result.current.lifecycleStatus)).toBe(false);
      expect(result.current.txHash).toBe('pending-timeout-hash');
      expect(result.current.success).toBe(false);
      expect(invalidateQueriesMock).not.toHaveBeenCalled();

      const toastArg = updateToastMock.mock.calls[0][1] as {
        type?: string;
        action?: unknown;
        txHash?: string;
      };
      expect(toastArg.type).toBe('warning');
      expect(toastArg.txHash).toBe('pending-timeout-hash');
      expect(toastArg.action).toBeUndefined();

      // Subsequent execute while outcome is unknown (confirming) is blocked to prevent duplicate submission.
      const followUpOp = vi.fn();
      let followUpResult: unknown = 'not-null';
      await act(async () => {
        followUpResult = await result.current.execute(followUpOp);
      });
      expect(followUpResult).toBeNull();
      expect(followUpOp).not.toHaveBeenCalled();
    });
  });
});
