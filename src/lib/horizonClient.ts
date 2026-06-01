/**
 * horizonClient.ts
 *
 * Centralised Horizon / RPC request layer with:
 *  - In-flight deduplication  – identical concurrent calls share one promise
 *  - TTL-based response cache  – configurable per call type
 *  - Batch address lookups     – coalesces multiple account fetches into one
 *                                 request per tick via microtask batching
 *
 * TTLs (ms):
 *   balances   30 000   (matches BALANCE_REFRESH_INTERVAL_MS in useBalances)
 *   federation 600 000  (10 min – federation records rarely change)
 *   events      60 000  (contract event pages)
 *
 * Expected API call reduction
 * ───────────────────────────
 * Before: N components × M tokens = N×M balance RPC calls per render cycle.
 * After:  1 deduplicated call per unique (address, tokenId) pair per 30 s.
 *
 * Before: every ProfilePage / DelegationPanel resolves federation independently.
 * After:  one Horizon account fetch per address per 10 min; federation server
 *         hit only once per address per session.
 *
 * In a typical LP dashboard with 3 components each reading 3 token balances for
 * the same wallet this reduces 9 RPC calls to 3 (−67 %).
 */

import { STELLAR_NETWORK } from "@/constants";

// ─── TTLs ─────────────────────────────────────────────────────────────────────

export const TTL = {
  BALANCE: 30_000,
  FEDERATION: 10 * 60_000,
  EVENTS: 60_000,
} as const;

// ─── Generic cache entry ──────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// ─── Core deduplication / cache store ────────────────────────────────────────

/**
 * Shared in-flight map: key → Promise<T>
 * Cleared once the promise settles so the next call after TTL expiry re-fetches.
 */
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Shared response cache: key → CacheEntry<T>
 */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Deduplicated, cached fetch.
 *
 * - If a fresh cache entry exists, returns it synchronously (wrapped in a
 *   resolved promise).
 * - If an identical request is already in-flight, returns the same promise.
 * - Otherwise executes `fetcher`, caches the result, and returns the promise.
 */
export async function dedupedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
): Promise<T> {
  // 1. Cache hit
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  // 2. In-flight deduplication
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  // 3. New request
  const promise = fetcher().then(
    (value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      inFlight.delete(key);
      return value;
    },
    (err: unknown) => {
      inFlight.delete(key);
      throw err;
    },
  );

  inFlight.set(key, promise);
  return promise;
}

/** Manually invalidate a cache entry (e.g. after a write transaction). */
export function invalidateCache(key: string): void {
  cache.delete(key);
  // Leave in-flight alone – it will clean itself up on settle.
}

/** Invalidate all cache entries whose key starts with `prefix`. */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/** Exposed for tests only – wipes all state. */
export function __resetHorizonClient(): void {
  cache.clear();
  inFlight.clear();
  pendingAccountFetches.clear();
  batchTimer = null;
}

// ─── Horizon account batch fetcher ───────────────────────────────────────────
//
// Multiple callers requesting the same address within one microtask tick are
// coalesced into a single Horizon /accounts/{address} fetch.  Different
// addresses requested in the same tick are fetched in parallel (Horizon has no
// multi-account endpoint), but each address is still deduplicated.

type AccountResolve = (value: HorizonAccountData) => void;
type AccountReject = (reason: unknown) => void;

export interface HorizonAccountBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

export interface HorizonAccountData {
  id: string;
  account_id: string;
  home_domain?: string;
  homeDomain?: string;
  balances: HorizonAccountBalance[];
}

const pendingAccountFetches = new Map<
  string,
  Array<{ resolve: AccountResolve; reject: AccountReject }>
>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function getHorizonBase(): string {
  return STELLAR_NETWORK === "mainnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

function flushAccountBatch(): void {
  batchTimer = null;
  const addresses = [...pendingAccountFetches.keys()];
  const callbacks = new Map(pendingAccountFetches);
  pendingAccountFetches.clear();

  const base = getHorizonBase();

  for (const address of addresses) {
    const waiters = callbacks.get(address)!;
    const cacheKey = `account:${address}`;

    // Check cache first (another batch may have already populated it)
    const cached = cache.get(cacheKey) as CacheEntry<HorizonAccountData> | undefined;
    if (cached && Date.now() < cached.expiresAt) {
      waiters.forEach(({ resolve }) => resolve(cached.value));
      continue;
    }

    fetch(`${base}/accounts/${address}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            const empty: HorizonAccountData = {
              id: address,
              account_id: address,
              balances: [],
            };
            cache.set(cacheKey, { value: empty, expiresAt: Date.now() + TTL.BALANCE });
            waiters.forEach(({ resolve }) => resolve(empty));
            return;
          }
          throw new Error(`Horizon account fetch failed: ${res.status}`);
        }
        const data = (await res.json()) as HorizonAccountData;
        cache.set(cacheKey, { value: data, expiresAt: Date.now() + TTL.BALANCE });
        waiters.forEach(({ resolve }) => resolve(data));
      })
      .catch((err: unknown) => {
        waiters.forEach(({ reject }) => reject(err));
      });
  }
}

/**
 * Fetch a Horizon account record.
 *
 * Calls within the same event-loop tick for the same address are batched into
 * one HTTP request.  Results are cached for {@link TTL.BALANCE} ms.
 */
export function fetchHorizonAccount(address: string): Promise<HorizonAccountData> {
  const cacheKey = `account:${address}`;

  // Fast path: cache hit
  const cached = cache.get(cacheKey) as CacheEntry<HorizonAccountData> | undefined;
  if (cached && Date.now() < cached.expiresAt) {
    return Promise.resolve(cached.value);
  }

  return new Promise<HorizonAccountData>((resolve, reject) => {
    if (!pendingAccountFetches.has(address)) {
      pendingAccountFetches.set(address, []);
    }
    pendingAccountFetches.get(address)!.push({ resolve, reject });

    // Schedule the batch flush once per tick
    if (batchTimer === null) {
      batchTimer = setTimeout(flushAccountBatch, 0);
    }
  });
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/**
 * Fetch the native XLM balance for an address.
 * Reuses the batched account fetch so multiple callers share one HTTP request.
 */
export async function fetchNativeXlmBalance(address: string): Promise<number> {
  const account = await fetchHorizonAccount(address);
  const native = account.balances.find((b) => b.asset_type === "native");
  return Number(native?.balance ?? 0);
}

/**
 * Fetch the home_domain for an address.
 * Cached for {@link TTL.FEDERATION} ms.
 */
export async function fetchHomeDomain(address: string): Promise<string | null> {
  return dedupedFetch(
    `home_domain:${address}`,
    async () => {
      const account = await fetchHorizonAccount(address);
      return (account.home_domain ?? account.homeDomain) ?? null;
    },
    TTL.FEDERATION,
  );
}
