'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Live USD price lookups for supported tokens (#22, #328).
 *
 * Prices come from CoinGecko's public simple-price endpoint. To keep API usage
 * low, every supported token is fetched in a *single* batched request and the
 * results are cached at module scope for {@link PRICE_CACHE_TTL_MS}.
 *
 * Reads are stale-while-revalidate: a cached price is returned immediately (even
 * once expired) and a background refresh is kicked off when the data is stale,
 * so the UI never blocks. On any network error the last known price is retained
 * as a graceful fallback; only a token that has never resolved reports `null`.
 */

/** How long a fetched price is considered fresh before a background refresh. */
export const PRICE_CACHE_TTL_MS = 5 * 60_000;

/** Maps a token symbol to its CoinGecko coin id. */
const COINGECKO_IDS: Record<string, string> = {
  USDC: 'usd-coin',
  EURC: 'euro-coin',
  XLM: 'stellar',
};

/** Token symbols this module knows how to price. */
export const SUPPORTED_TOKENS = Object.keys(COINGECKO_IDS);

export function coinGeckoId(symbol: string): string | null {
  return COINGECKO_IDS[symbol.toUpperCase()] ?? null;
}

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

const priceCache = new Map<string, CacheEntry>();

/** A single in-flight batch request shared by all concurrent callers. */
let inflight: Promise<void> | null = null;

/** Exposed for tests; clears the module-level price cache and in-flight state. */
export function __clearPriceCache(): void {
  priceCache.clear();
  inflight = null;
}

function isFresh(entry: CacheEntry | undefined, now: number): boolean {
  return !!entry && now - entry.fetchedAt < PRICE_CACHE_TTL_MS;
}

/**
 * Fetch every supported token price in one request and update the cache.
 *
 * Concurrent callers share the same in-flight promise, so a burst of consumers
 * mounting at once still results in a single network call.
 */
export function fetchAllPrices(): Promise<void> {
  if (inflight) return inflight;

  const ids = SUPPORTED_TOKENS.map((symbol) => COINGECKO_IDS[symbol]);

  inflight = (async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
      );
      if (!response.ok) {
        throw new Error(`Price request failed: ${response.status}`);
      }

      const data = (await response.json()) as Record<string, { usd?: number }>;
      const fetchedAt = Date.now();
      for (const id of ids) {
        const price = data?.[id]?.usd;
        if (typeof price === 'number') {
          priceCache.set(id, { price, fetchedAt });
        }
      }
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Last known price for a symbol, regardless of freshness (the fallback). */
function cachedPrice(symbol: string): number | null {
  const id = coinGeckoId(symbol);
  if (!id) return null;
  return priceCache.get(id)?.price ?? null;
}

function snapshot(symbols: string[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const symbol of symbols) out[symbol] = cachedPrice(symbol);
  return out;
}

export interface UseTokenPricesResult {
  /** USD price per 1 token keyed by symbol; null when unknown / never fetched. */
  prices: Record<string, number | null>;
  /** True only while fetching with no cached value yet to display. */
  isLoading: boolean;
  /** Force a refresh regardless of cache freshness. */
  refresh: () => void;
}

/**
 * Batch price hook: returns USD prices for the given (default: all) supported
 * tokens from a single cached API call, refreshing stale data in the background
 * without blocking the UI and falling back to the last known price on error.
 */
export function useTokenPrices(symbols: string[] = SUPPORTED_TOKENS): UseTokenPricesResult {
  // Stable dependency so the effect only re-runs when the set of symbols changes.
  const key = symbols.join(',');

  // Bumped whenever the cache changes, to recompute the snapshot below.
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Derived from the cache at render time — surfaces the last known price
  // immediately (the graceful fallback) without an extra state write.
  const prices = useMemo(
    () => snapshot(key ? key.split(',') : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` forces a recompute after refreshes.
    [key, version]
  );

  useEffect(() => {
    const supported = (key ? key.split(',') : []).filter((symbol) => coinGeckoId(symbol));
    if (supported.length === 0) return;

    const now = Date.now();
    const allFresh = supported.every((symbol) =>
      isFresh(priceCache.get(coinGeckoId(symbol)!), now)
    );
    if (allFresh) return;

    let cancelled = false;
    const run = async () => {
      // Block the UI only when there is nothing cached to show yet; a stale
      // value stays visible while the refresh runs in the background.
      const haveSomething = supported.some((symbol) => cachedPrice(symbol) !== null);
      if (!haveSomething) setIsLoading(true);
      try {
        await fetchAllPrices();
      } catch {
        // Swallow — the last known prices remain cached as the fallback.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setVersion((v) => v + 1);
        }
      }
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [key]);

  const refresh = useCallback(() => {
    fetchAllPrices()
      .catch(() => {})
      .finally(() => setVersion((v) => v + 1));
  }, []);

  return { prices, isLoading, refresh };
}

export interface UseTokenPriceResult {
  /** USD price per 1 token, or null if unknown / failed. */
  usdPrice: number | null;
  isLoading: boolean;
}

/**
 * Single-token convenience wrapper around {@link useTokenPrices}. Backed by the
 * same batched, cached request, so mounting several of these triggers at most
 * one network call.
 */
export function useTokenPrice(symbol: string | null | undefined): UseTokenPriceResult {
  const symbols = symbol && coinGeckoId(symbol) ? [symbol] : [];
  const { prices, isLoading } = useTokenPrices(symbols);
  const usdPrice = symbol ? (prices[symbol] ?? null) : null;
  return { usdPrice, isLoading };
}
