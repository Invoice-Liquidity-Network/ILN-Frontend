import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBalances, BALANCE_REFRESH_INTERVAL_MS } from '../useBalances';
import { TX_SUCCESS_EVENT } from '@/utils/txEvents';
import type { ApprovedToken } from '@/hooks/useApprovedTokens';

const walletState = {
  address: 'GTEST',
  isConnected: true,
  networkMismatch: false,
};

vi.mock('@/context/WalletContext', () => ({
  useWallet: () => walletState,
}));

const getTokenBalance = vi.fn();
vi.mock('@/utils/soroban', () => ({
  getTokenBalance: (...args: unknown[]) => getTokenBalance(...args),
}));

function token(contractId: string, isAllowed = true): ApprovedToken {
  return {
    contractId,
    name: contractId,
    symbol: contractId,
    decimals: 7,
    iconLabel: contractId.slice(0, 2),
    logo: `/tokens/${contractId}.svg`,
    isAllowed,
  } as ApprovedToken;
}

const USDC = token('USDC');
const EURC = token('EURC');
const DISALLOWED = token('OLD', false);

beforeEach(() => {
  getTokenBalance.mockReset();
  walletState.address = 'GTEST';
  walletState.isConnected = true;
  walletState.networkMismatch = false;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useBalances', () => {
  it('loads balances for allowed tokens and ignores disallowed ones', async () => {
    getTokenBalance.mockImplementation(async (_addr: string, id: string) =>
      id === 'USDC' ? 100n : 50n
    );

    const { result } = renderHook(() => useBalances([USDC, EURC, DISALLOWED]));

    await waitFor(() => expect(result.current.balances.size).toBe(2));
    expect(result.current.balances.get('USDC')).toBe(100n);
    expect(result.current.balances.get('EURC')).toBe(50n);
    // Disallowed token is never queried.
    expect(getTokenBalance).not.toHaveBeenCalledWith('GTEST', 'OLD');
    expect(result.current.unavailable.size).toBe(0);
  });

  it('flags tokens whose balance cannot be read as unavailable (missing trustline)', async () => {
    getTokenBalance.mockImplementation(async (_addr: string, id: string) => {
      if (id === 'EURC') throw new Error('no trustline');
      return 100n;
    });

    const { result } = renderHook(() => useBalances([USDC, EURC]));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.balances.get('USDC')).toBe(100n);
    expect(result.current.balances.has('EURC')).toBe(false);
    expect(result.current.unavailable.has('EURC')).toBe(true);
  });

  it('clears balances when the wallet is on the wrong network', async () => {
    walletState.networkMismatch = true;
    getTokenBalance.mockResolvedValue(100n);

    const { result } = renderHook(() => useBalances([USDC]));

    await waitFor(() => expect(result.current.balances.size).toBe(0));
    expect(getTokenBalance).not.toHaveBeenCalled();
  });

  it('refetches when a transaction-success event fires', async () => {
    getTokenBalance.mockResolvedValue(10n);
    const { result } = renderHook(() => useBalances([USDC]));
    await waitFor(() => expect(result.current.balances.get('USDC')).toBe(10n));

    getTokenBalance.mockResolvedValue(99n);
    await act(async () => {
      window.dispatchEvent(new CustomEvent(TX_SUCCESS_EVENT));
    });

    await waitFor(() => expect(result.current.balances.get('USDC')).toBe(99n));
  });

  it('polls on the refresh interval', async () => {
    vi.useFakeTimers();
    getTokenBalance.mockResolvedValue(1n);
    renderHook(() => useBalances([USDC]));

    // Initial load.
    await vi.waitFor(() => expect(getTokenBalance).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(BALANCE_REFRESH_INTERVAL_MS);
    });
    expect(getTokenBalance).toHaveBeenCalledTimes(2);
  });
});
