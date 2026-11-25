import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTransaction } from '../useTransaction';

const mockAddToast = vi.fn(() => 'toast-id');
const mockUpdateToast = vi.fn();
const mockRequestPreview = vi.fn().mockResolvedValue(true);

vi.mock('@/context/WalletContext', () => ({ useWallet: vi.fn() }));
vi.mock('@/utils/soroban', () => ({ submitSignedTransaction: vi.fn() }));
vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast, updateToast: mockUpdateToast }),
}));
vi.mock('@/hooks/useTransactionPreview', () => ({
  useTransactionPreview: () => ({
    previewModal: null,
    requestPreview: mockRequestPreview,
  }),
}));

import { useWallet } from '@/context/WalletContext';
import { submitSignedTransaction } from '@/utils/soroban';

const mockTx = {} as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTransaction', () => {
  it('returns error when wallet not connected', async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: false,
      address: null,
      networkMismatch: false,
      signTx: vi.fn(),
    } as any);
    const { result } = renderHook(() => useTransaction());
    let txHash: string | null = null;
    await act(async () => {
      txHash = await result.current.execute(mockTx);
    });
    expect(txHash).toBeNull();
    expect(result.current.error).toBe('Wallet not connected');
  });

  it('blocks transaction and explains required network when networkMismatch is true', async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      address: 'GTEST',
      networkMismatch: true,
      walletNetwork: 'MAINNET',
      signTx: vi.fn(),
    } as any);

    const { result } = renderHook(() => useTransaction());
    let txHash: string | null = null;
    await act(async () => {
      txHash = await result.current.execute(mockTx);
    });

    expect(txHash).toBeNull();
    expect(result.current.error).toContain('Wrong network detected');
    expect(result.current.error).toContain('TESTNET');
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'Wrong Network Blocked',
      })
    );
    expect(submitSignedTransaction).not.toHaveBeenCalled();
  });

  it('returns tx hash on success and surfaces confirmed hash in toast', async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      address: 'GTEST',
      networkMismatch: false,
      signTx: vi.fn(),
    } as any);
    const validHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    vi.mocked(submitSignedTransaction).mockResolvedValue({ txHash: validHash } as any);
    const { result } = renderHook(() => useTransaction());
    let txHash: string | null = null;
    await act(async () => {
      txHash = await result.current.execute(mockTx);
    });
    expect(txHash).toBe(validHash);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockUpdateToast).toHaveBeenCalledWith(
      'toast-id',
      expect.objectContaining({
        type: 'success',
        txHash: validHash,
      })
    );
  });

  it('sets error on transaction failure', async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      address: 'GTEST',
      networkMismatch: false,
      signTx: vi.fn(),
    } as any);
    vi.mocked(submitSignedTransaction).mockRejectedValue(new Error('tx rejected'));
    const { result } = renderHook(() => useTransaction());
    let txHash: string | null = 'init';
    await act(async () => {
      txHash = await result.current.execute(mockTx);
    });
    expect(txHash).toBeNull();
    expect(result.current.error).toBe('tx rejected');
    expect(result.current.loading).toBe(false);
  });

  it('sets loading=true during execution then resets', async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      address: 'GTEST',
      networkMismatch: false,
      signTx: vi.fn(),
    } as any);
    let resolve!: (v: any) => void;
    vi.mocked(submitSignedTransaction).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const { result } = renderHook(() => useTransaction());
    act(() => {
      void result.current.execute(mockTx);
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      resolve({ txHash: 'done' });
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles contract mapped errors', async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      address: 'GTEST',
      networkMismatch: false,
      signTx: vi.fn(),
    } as any);
    vi.mocked(submitSignedTransaction).mockRejectedValue(new Error('InvalidDiscountRate'));
    const { result } = renderHook(() => useTransaction());

    let txHash: string | null = 'init';
    await act(async () => {
      txHash = await result.current.execute(mockTx);
    });

    expect(txHash).toBeNull();
    expect(result.current.error).toBe('InvalidDiscountRate');
  });

  it('enforces idempotency and prevents concurrent duplicate in-flight operations', async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      address: 'GTEST',
      networkMismatch: false,
      signTx: vi.fn(),
    } as any);

    let resolveOperation!: (v: any) => void;
    vi.mocked(submitSignedTransaction).mockReturnValue(
      new Promise((r) => {
        resolveOperation = r;
      })
    );

    const { result } = renderHook(() => useTransaction());

    let firstPromise: Promise<any>;
    let secondPromise: Promise<any>;

    act(() => {
      firstPromise = result.current.execute(mockTx, { title: 'Deduplicated Op' });
      // Rapid concurrent click with identical title/key
      secondPromise = result.current.execute(mockTx, { title: 'Deduplicated Op' });
    });

    let firstResult: any;
    let secondResult: any;

    await act(async () => {
      secondResult = await secondPromise;
      resolveOperation({ txHash: 'tx-first-success' });
      firstResult = await firstPromise;
    });

    // The concurrent duplicate execution was blocked
    expect(secondResult).toBeNull();
    expect(firstResult).toBe('tx-first-success');
    expect(submitSignedTransaction).toHaveBeenCalledTimes(1);
  });

  it('recovers confirmed result idempotently when retrying within cache window', async () => {
    vi.mocked(useWallet).mockReturnValue({
      isConnected: true,
      address: 'GTEST',
      networkMismatch: false,
      signTx: vi.fn(),
    } as any);

    vi.mocked(submitSignedTransaction).mockResolvedValue({ txHash: 'tx-cached-hash' } as any);

    const { result } = renderHook(() => useTransaction());

    let firstResult: any;
    await act(async () => {
      firstResult = await result.current.execute(mockTx, { idempotencyKey: 'idem-key-1' });
    });
    expect(firstResult).toBe('tx-cached-hash');
    expect(submitSignedTransaction).toHaveBeenCalledTimes(1);

    // Call again with same idempotencyKey
    let secondResult: any;
    await act(async () => {
      secondResult = await result.current.execute(mockTx, { idempotencyKey: 'idem-key-1' });
    });

    expect(secondResult).toBe('tx-cached-hash');
    // submitSignedTransaction was not called a second time
    expect(submitSignedTransaction).toHaveBeenCalledTimes(1);
  });

  it('handles disconnect recovery by resetting in-flight transaction state', async () => {
    let isConnected = true;
    vi.mocked(useWallet).mockImplementation(
      () =>
        ({
          isConnected,
          address: isConnected ? 'GTEST' : null,
          networkMismatch: false,
          signTx: vi.fn(),
        }) as any
    );

    let resolvePending!: (v: any) => void;
    vi.mocked(submitSignedTransaction).mockReturnValue(
      new Promise((r) => {
        resolvePending = r;
      })
    );

    const { result, rerender } = renderHook(() => useTransaction());

    act(() => {
      void result.current.execute(mockTx, { title: 'Pending Disconnect' });
    });

    expect(result.current.loading).toBe(true);

    // Wallet disconnects mid-transaction
    isConnected = false;
    act(() => {
      rerender();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('Wallet disconnected during transaction');
    expect(mockUpdateToast).toHaveBeenCalledWith(
      'toast-id',
      expect.objectContaining({
        type: 'error',
        title: 'Transaction Interrupted',
      })
    );

    // Clean up unresolved promise
    await act(async () => {
      resolvePending({ txHash: 'ignored' });
      await Promise.resolve();
    });
  });
});

describe('network mismatch protection across money-moving flows (#1286)', () => {
  const moneyMovingFlows = [
    {
      flow: 'funding',
      useOperationFn: true,
      options: { expectedAction: 'fund_invoice' as const, title: 'Fund Invoice' },
    },
    {
      flow: 'funding token approval',
      useOperationFn: true,
      options: { expectedAction: 'approve' as const, title: 'Approve Token Spend' },
    },
    {
      flow: 'settlement',
      useOperationFn: false,
      options: { expectedAction: 'mark_paid' as const, title: 'Mark invoice paid' },
    },
    {
      flow: 'cancellation',
      useOperationFn: false,
      options: { expectedAction: 'cancel_invoice' as const, title: 'Cancel invoice' },
    },
    {
      flow: 'default / insurance claim',
      useOperationFn: true,
      options: { title: 'Claim Default' },
    },
    {
      flow: 'insurance pool deposit',
      useOperationFn: true,
      options: { title: 'Deposit Insurance Premium' },
    },
  ];

  it.each(moneyMovingFlows)(
    'blocks $flow before preview or signing when networkMismatch is true',
    async ({ useOperationFn, options }) => {
      const signTx = vi.fn();
      const operationSpy = vi.fn().mockResolvedValue('should-not-run');
      vi.mocked(useWallet).mockReturnValue({
        isConnected: true,
        address: 'GTEST',
        networkMismatch: true,
        walletNetwork: 'MAINNET',
        signTx,
      } as any);

      const { result } = renderHook(() => useTransaction());
      let outcome: unknown = 'pending';
      await act(async () => {
        outcome = await result.current.execute(useOperationFn ? operationSpy : mockTx, options);
      });

      expect(outcome).toBeNull();
      expect(signTx).not.toHaveBeenCalled();
      expect(mockRequestPreview).not.toHaveBeenCalled();
      expect(operationSpy).not.toHaveBeenCalled();
      expect(submitSignedTransaction).not.toHaveBeenCalled();
      expect(result.current.lifecycleStatus).toBe('unsigned');
      expect(result.current.success).toBe(false);
      expect(result.current.error).toContain('Wrong network detected (MAINNET)');
      expect(result.current.error).toContain('TESTNET');
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Wrong Network Blocked',
        })
      );
      const toastArg = mockAddToast.mock.calls[0][0] as { action?: unknown };
      expect(toastArg.action).toBeUndefined();
    }
  );

  it('allows the flow to proceed once the wallet switches to the matching network', async () => {
    let networkMismatch = true;
    const signTx = vi.fn().mockResolvedValue('signed-xdr');
    vi.mocked(useWallet).mockImplementation(
      () =>
        ({
          isConnected: true,
          address: 'GTEST',
          networkMismatch,
          walletNetwork: networkMismatch ? 'MAINNET' : 'TESTNET',
          signTx,
        }) as any
    );
    vi.mocked(submitSignedTransaction).mockResolvedValue({ txHash: 'settled-after-switch' } as any);

    const { result, rerender } = renderHook(() => useTransaction());

    // First attempt on wrong network is blocked cleanly without leaking in-flight state.
    let blocked: unknown = 'pending';
    await act(async () => {
      blocked = await result.current.execute(mockTx, {
        expectedAction: 'fund_invoice',
        title: 'Fund Invoice',
      });
    });
    expect(blocked).toBeNull();
    expect(submitSignedTransaction).not.toHaveBeenCalled();

    // User switches wallet to TESTNET and retries.
    networkMismatch = false;
    rerender();

    let confirmed: unknown = null;
    await act(async () => {
      confirmed = await result.current.execute(mockTx, {
        expectedAction: 'fund_invoice',
        title: 'Fund Invoice',
      });
    });
    expect(confirmed).toBe('settled-after-switch');
    expect(result.current.lifecycleStatus).toBe('confirmed');
    expect(submitSignedTransaction).toHaveBeenCalledTimes(1);
  });
});
