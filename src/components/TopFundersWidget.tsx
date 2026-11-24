'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import IndexerUnavailableNotice, {
  type IndexerNoticeStatus,
} from '@/components/IndexerUnavailableNotice';
import { IndexerFreshnessBadge } from '@/components/indexer/IndexerStatus';
import {
  classifyIndexerClientError,
  fetchLeaderboardEntries,
  indexerErrorDetail,
} from '@/lib/indexer-client';
import {
  evaluateIndexerFreshness,
  isIndexerFreshness,
  type IndexerFreshness,
} from '@/lib/indexer/freshness';

export type Funder = {
  address: string;
  amountFunded: number;
  yieldEarned: number;
  fundedCount: number;
  avgDiscountRate: number;
};

interface CachedTopFundersSnapshot {
  savedAt: number;
  rows: Funder[];
  freshness: IndexerFreshness;
}

const CACHE_KEY = 'iln_top_funders_30d';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_CLOCK_SKEW_MS = 5 * 60 * 1000;

const RANK_BADGES = ['🥇', '🥈', '🥉'];

function truncateAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

function safeFiniteNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Normalizes and deduplicates indexer-derived leaderboard entries.
 * Preserves the indexer-supplied ranking order, keeps the first occurrence of
 * each case-insensitive address, drops empty addresses, and caps at 10 rows.
 */
export function normalizeFunders(data: unknown): Funder[] {
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  const normalized: Funder[] = [];

  for (const raw of data) {
    if (typeof raw !== 'object' || raw === null) continue;
    const item = raw as Record<string, unknown>;
    const address = String(item.address ?? item.lp ?? '').trim();
    if (address.length === 0) continue;

    const dedupeKey = address.toUpperCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    normalized.push({
      address,
      amountFunded: safeFiniteNumber(item.amountFunded ?? item.totalFunded ?? item.metric3 ?? 0),
      yieldEarned: safeFiniteNumber(item.yieldEarned ?? item.totalYield ?? item.metric4 ?? 0),
      fundedCount: safeFiniteNumber(item.fundedCount ?? item.metric1 ?? 0),
      avgDiscountRate: safeFiniteNumber(item.avgDiscountRate ?? item.metric2 ?? 0),
    });

    if (normalized.length >= 10) break;
  }

  return normalized;
}

function isCachedSnapshotUsable(
  cached: unknown,
  now: number = Date.now()
): cached is CachedTopFundersSnapshot {
  if (typeof cached !== 'object' || cached === null) return false;
  const candidate = cached as Record<string, unknown>;

  if (!Array.isArray(candidate.rows)) return false;
  if (typeof candidate.savedAt !== 'number' || !Number.isFinite(candidate.savedAt)) return false;
  if (candidate.savedAt > now + MAX_CACHE_CLOCK_SKEW_MS) return false;
  if (now - candidate.savedAt >= CACHE_TTL_MS) return false;
  if (!isIndexerFreshness(candidate.freshness)) return false;
  if (evaluateIndexerFreshness(candidate.freshness, now).state === 'stale') return false;

  return true;
}

/**
 * Displays the top 10 active liquidity providers over the past 30 days.
 *
 * Assumptions & data source:
 * - Ranking is strictly indexer-derived via `fetchLeaderboardEntries('lp', '30d', 10)`
 *   through `/api/indexer/leaderboard` (no client-side ranking synthesis).
 * - Duplicate addresses are removed while preserving indexer rank order.
 * - Cached snapshots in `localStorage` require valid `IndexerFreshness` metadata,
 *   a non-future `savedAt` timestamp within `CACHE_TTL_MS`, and non-stale freshness state.
 * - Fetch/proxy failures always render `IndexerUnavailableNotice` rather than an empty state.
 *
 * Residual risk:
 * - When the upstream indexer omits `X-Indexer-Last-Indexed-At` (`freshness.state === 'unknown'`),
 *   cache expiry relies on the 24h `CACHE_TTL_MS` client timestamp.
 */
export default function TopFundersWidget() {
  const { addToast } = useToast();
  const [rows, setRows] = useState<Funder[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [requestId, setRequestId] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [errorStatus, setErrorStatus] = useState<IndexerNoticeStatus>('unavailable');
  const [errorDetail, setErrorDetail] = useState<string | undefined>();
  const [freshness, setFreshness] = useState<IndexerFreshness | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setUnavailable(false);

        let cachedRaw: string | null = null;
        try {
          cachedRaw = localStorage.getItem(CACHE_KEY);
        } catch {
          cachedRaw = null;
        }

        if (cachedRaw) {
          try {
            const cached: unknown = JSON.parse(cachedRaw);
            // Caches without valid freshness, with future timestamps, or already stale are refetched.
            if (isCachedSnapshotUsable(cached)) {
              if (!cancelled) {
                setRows(normalizeFunders(cached.rows));
                setFreshness(cached.freshness);
                setLoading(false);
              }
              return;
            }
          } catch {
            // Corrupted cache entry is ignored and replaced by a live fetch.
          }
        }

        let latestFreshness: IndexerFreshness | null = null;
        const data = await fetchLeaderboardEntries('lp', '30d', 10, {
          onMeta: (meta) => {
            latestFreshness = meta.freshness;
          },
        });
        if (cancelled) return;

        const normalized = normalizeFunders(data);
        setRows(normalized);
        setFreshness(latestFreshness);
        if (isIndexerFreshness(latestFreshness)) {
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                savedAt: Date.now(),
                rows: normalized,
                freshness: latestFreshness,
              })
            );
          } catch {
            // Storage quota or privacy mode failure does not invalidate live data.
          }
        }
      } catch (err) {
        if (cancelled) return;
        // Every failure is surfaced; an unreachable indexer is never shown as "no LPs".
        setRows([]);
        setUnavailable(true);
        setErrorDetail(indexerErrorDetail(err));
        const boundary = classifyIndexerClientError(err);
        setErrorStatus(
          boundary === 'rate-limited' || boundary === 'unauthorized' || boundary === 'malformed'
            ? boundary
            : 'unavailable'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const retry = () => {
    setRetrying(true);
    setUnavailable(false);
    setRequestId((id) => id + 1);
    window.setTimeout(() => setRetrying(false), 600);
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      addToast({
        type: 'success',
        title: 'Address copied',
        message: 'LP address copied to clipboard.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Copy failed',
        message: 'Could not copy LP address.',
      });
    }
  };

  return (
    <section
      className="mt-6 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-xl"
      aria-label="Top funders"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          Active liquidity providers on ILN
        </h2>
        <a
          href="/leaderboard"
          className="text-xs font-semibold text-primary transition-opacity hover:opacity-80"
        >
          View Full Leaderboard →
        </a>
      </div>

      {loading && <p className="mt-3 text-sm text-on-surface-variant">Loading active LPs...</p>}

      {!loading && unavailable && (
        <div className="mt-4">
          <IndexerUnavailableNotice
            dataSource="The LP leaderboard"
            status={errorStatus}
            detail={errorDetail}
            onRetry={retry}
            retrying={retrying}
          />
        </div>
      )}

      {!loading && !unavailable && freshness ? (
        <div className="mt-3">
          <IndexerFreshnessBadge freshness={freshness} />
        </div>
      ) : null}

      {!loading && !unavailable && rows.length === 0 && (
        <p className="mt-3 text-sm text-on-surface-variant">
          No active LP leaderboard data is available right now.
        </p>
      )}

      {!loading && rows.length > 0 && (
        <div className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.address}
              className="rounded-xl border border-outline-variant/15 bg-surface p-4"
              style={
                index < 3
                  ? { animation: `fadeInUp 0.45s ease-out ${index * 0.1}s both` }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => copyAddress(row.address)}
                  className="font-mono text-sm font-semibold text-primary transition-opacity hover:opacity-80"
                >
                  {index < 3 ? RANK_BADGES[index] : `${index + 1}.`} {truncateAddress(row.address)}
                </button>
                <span className="shrink-0 text-sm text-on-surface">
                  {row.fundedCount} invoices (30d)
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                <span>
                  <span className="font-medium text-on-surface">Amount funded:</span>{' '}
                  {formatAmount(row.amountFunded)}
                </span>
                <span>
                  <span className="font-medium text-on-surface">Yield earned:</span>{' '}
                  {formatAmount(row.yieldEarned)}
                </span>
                <span>Avg discount: {row.avgDiscountRate.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
