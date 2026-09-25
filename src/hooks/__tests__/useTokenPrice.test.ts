import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useTokenPrice,
  useTokenPrices,
  coinGeckoId,
  __clearPriceCache,
  PRICE_CACHE_TTL_MS,
} from '../useTokenPrice';

const fetchMock = vi.fn();

beforeEach(() => {
  __clearPriceCache();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function priceResponse(id: string, usd: number) {
  return { ok: true, json: async () => ({ [id]: { usd } }) } as Response;
}

function allPricesResponse(prices: Record<string, number>) {
  const body: Record<string, { usd: number }> = {};
  for (const [id, usd] of Object.entries(prices)) body[id] = { usd };
  return { ok: true, json: async () => body } as Response;
}

describe('coinGeckoId', () => {
  it('maps known token symbols', () => {
    expect(coinGeckoId('USDC')).toBe('usd-coin');
    expect(coinGeckoId('xlm')).toBe('stellar');
  });
  it('returns null for unknown symbols', () => {
    expect(coinGeckoId('DOGE')).toBeNull();
  });
});

describe('useTokenPrice', () => {
  it('returns the fetched USD price', async () => {
    fetchMock.mockResolvedValue(priceResponse('stellar', 0.12));
    const { result } = renderHook(() => useTokenPrice('XLM'));
    await waitFor(() => expect(result.current.usdPrice).toBe(0.12));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('serves a cached price within the TTL instead of refetching', async () => {
    fetchMock.mockResolvedValue(priceResponse('usd-coin', 1));
    const first = renderHook(() => useTokenPrice('USDC'));
    await waitFor(() => expect(first.result.current.usdPrice).toBe(1));

    const second = renderHook(() => useTokenPrice('USDC'));
    await waitFor(() => expect(second.result.current.usdPrice).toBe(1));
    // Second mount is served from cache — fetch is not called again.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails soft to null on a network error', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTokenPrice('XLM'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.usdPrice).toBeNull();
  });

  it('does not fetch for an unsupported token', async () => {
    const { result } = renderHook(() => useTokenPrice('DOGE'));
    await waitFor(() => expect(result.current.usdPrice).toBeNull());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('useTokenPrices (batch)', () => {
  it('fetches all supported token prices in a single API call', async () => {
    fetchMock.mockResolvedValue(
      allPricesResponse({ 'usd-coin': 1, 'euro-coin': 1.1, stellar: 0.12 })
    );

    const { result } = renderHook(() => useTokenPrices());

    await waitFor(() => {
      expect(result.current.prices.USDC).toBe(1);
      expect(result.current.prices.EURC).toBe(1.1);
      expect(result.current.prices.XLM).toBe(0.12);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('usd-coin');
    expect(url).toContain('euro-coin');
    expect(url).toContain('stellar');
  });

  it('reuses the cache for subsequent consumers without refetching', async () => {
    fetchMock.mockResolvedValue(
      allPricesResponse({ 'usd-coin': 1, 'euro-coin': 1.1, stellar: 0.12 })
    );

    const batch = renderHook(() => useTokenPrices());
    await waitFor(() => expect(batch.result.current.prices.USDC).toBe(1));

    // A later single-token consumer is served entirely from the warm cache.
    const single = renderHook(() => useTokenPrice('EURC'));
    await waitFor(() => expect(single.result.current.usdPrice).toBe(1.1));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('serves the last known price as a fallback when a refresh fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    fetchMock.mockResolvedValueOnce(
      allPricesResponse({ 'usd-coin': 1, 'euro-coin': 1.1, stellar: 0.12 })
    );
    const first = renderHook(() => useTokenPrices());
    await waitFor(() => expect(first.result.current.prices.XLM).toBe(0.12));

    // Age the cache past its TTL so the next read is stale.
    vi.setSystemTime(Date.now() + PRICE_CACHE_TTL_MS + 1);
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    const second = renderHook(() => useTokenPrices());

    // Stale-but-known price is shown immediately (does not block on the refresh).
    expect(second.result.current.prices.XLM).toBe(0.12);
    expect(second.result.current.isLoading).toBe(false);

    // Background refresh runs and fails; the fallback price is retained.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(second.result.current.prices.XLM).toBe(0.12);
  });
});
