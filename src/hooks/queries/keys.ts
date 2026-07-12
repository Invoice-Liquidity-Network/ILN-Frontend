/**
 * Centralised React Query key factories.
 *
 * Having every contract query derive its key from one place keeps cache
 * invalidation consistent and avoids the typo-prone scattering of inline
 * `["invoices"]` arrays across the codebase.
 *
 * NOTE: the values returned here intentionally match the literal keys that
 * already existed in the app (e.g. `["invoices"]`, `["invoice", id]`,
 * `["contract-stats"]`) so existing consumers — such as the contract event
 * sync that invalidates `["invoice", id]` — keep matching the same cache
 * entries.
 */

export const invoiceKeys = {
  /** All invoices list. */
  all: ['invoices'] as const,
  /** A single invoice by id. */
  detail: (id: bigint | string | number | null | undefined) => ['invoice', id?.toString()] as const,
  /** Total invoice count (cheap counter used by the homepage ticker). */
  count: ['invoice-count'] as const,
};

export const statsKeys = {
  /** Aggregated protocol stats (volume, funded, paid …). */
  all: ['contract-stats'] as const,
};

export const reputationKeys = {
  detail: (address: string) => ['reputation', address] as const,
};

export const governanceKeys = {
  /** Recent `ParameterUpdated` contract events for announcement banners. */
  parameterUpdates: ['parameter-updates'] as const,
};

/**
 * Recommended cache timings per query type. Centralised so the trade-off
 * between freshness and request volume is documented in one place.
 *
 * - `staleTime`: how long data is considered fresh (no background refetch).
 * - `gcTime`: how long unused data stays cached before garbage collection.
 */
export const QUERY_TIMINGS = {
  /** Invoice list — changes often via funding/payment events. */
  invoices: { staleTime: 15_000, gcTime: 5 * 60_000 },
  /** Single invoice detail. */
  invoiceDetail: { staleTime: 30_000, gcTime: 5 * 60_000 },
  /** Cheap invoice counter for the homepage ticker. */
  invoiceCount: { staleTime: 30_000, gcTime: 5 * 60_000 },
  /** Aggregated stats — expensive to compute, tolerate slight staleness. */
  stats: { staleTime: 60_000, gcTime: 10 * 60_000 },
  /** Governance parameter updates — slow-moving. */
  parameterUpdates: { staleTime: 5 * 60_000, gcTime: 30 * 60_000 },
} as const;
