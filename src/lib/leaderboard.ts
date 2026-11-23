import { IndexerError, type IndexerErrorCode } from '@/lib/indexer/errors';
import { loadIndexerResource, type IndexerRequestDeps } from '@/lib/indexer/server';
import type { IndexerResponseMeta } from '@/lib/indexer/types';

export type LeaderboardBoundaryStatus =
  | 'ok'
  | 'empty'
  | 'unavailable'
  | 'unauthorized'
  | 'rate-limited'
  | 'malformed';

export interface LeaderboardResult<T = unknown[]> {
  data: T;
  unavailable: boolean;
  status: LeaderboardBoundaryStatus;
  code?: IndexerErrorCode;
  error?: string;
  meta?: IndexerResponseMeta;
}

export interface LeaderboardFetchOptions extends IndexerRequestDeps {
  limit?: number;
  env?: Record<string, string | undefined>;
}

function mapErrorCodeToStatus(code: IndexerErrorCode): LeaderboardBoundaryStatus {
  if (code === 'unauthorized' || code === 'forbidden') return 'unauthorized';
  if (code === 'rate_limited') return 'rate-limited';
  if (code === 'schema' || code === 'version_mismatch' || code === 'bad_request') {
    return 'malformed';
  }
  return 'unavailable';
}

/**
 * Fetch the leaderboard from the server-only indexer client. Returns a discriminated
 * result so callers can distinguish "indexer temporarily unavailable" from "no rows" —
 * the former surfaces an honest unavailable state rather than empty data.
 *
 * Server-side only (`INDEXER_API_KEY` is never exposed to the client).
 */
export async function getLeaderboard<T = unknown[]>(
  type: string,
  period: string,
  limitOrOptions?: number | LeaderboardFetchOptions
): Promise<LeaderboardResult<T>> {
  const options: LeaderboardFetchOptions =
    typeof limitOrOptions === 'number' ? { limit: limitOrOptions } : (limitOrOptions ?? {});

  const params = new URLSearchParams({ type, period });
  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }

  try {
    const envelope = await loadIndexerResource(['leaderboard'], params, {
      fetchImpl: options.fetchImpl,
      signal: options.signal,
      env: options.env,
    });
    const data = envelope.data as unknown as T;
    const isEmpty = Array.isArray(data) && data.length === 0;
    return {
      data,
      unavailable: false,
      status: isEmpty ? 'empty' : 'ok',
      meta: envelope.meta,
    };
  } catch (err) {
    if (err instanceof IndexerError) {
      return {
        data: [] as unknown as T,
        unavailable: true,
        status: mapErrorCodeToStatus(err.code),
        code: err.code,
        error: err.message,
      };
    }

    return {
      data: [] as unknown as T,
      unavailable: true,
      status: 'unavailable',
      code: 'network',
      error: err instanceof Error ? err.message : 'Indexer request failed.',
    };
  }
}

// ─── Reorg Correction Handling (#1316) ───────────────────────────────────────

export interface LeaderboardEvent {
  /** Unique canonical event identifier (e.g. `txHash:eventIndex`). */
  id: string;
  /** Ledger sequence in which the event was emitted. */
  ledger: number;
  /** Optional ledger hash to help audit fork divergence. */
  ledgerHash?: string;
  /** Participant address (LP, payer, or freelancer). */
  address: string;
  /** Non-negative volume contribution for this event. */
  volume: number;
  /** Invoice/event count contribution (defaults to 1). */
  count?: number;
  /** Optional non-negative yield contribution. */
  yieldEarned?: number;
}

export interface LeaderboardAggregateRow {
  rank: number;
  address: string;
  totalVolume: number;
  eventCount: number;
  yieldEarned: number;
  lastLedger: number;
}

export interface LeaderboardReorgState {
  events: LeaderboardEvent[];
  rows: LeaderboardAggregateRow[];
  lastIndexedLedger: number | null;
  rolledBackCount: number;
}

export interface LeaderboardReorgCorrection {
  /** First invalidated ledger sequence (all events with `ledger >= rollbackToLedger` are removed). */
  rollbackToLedger: number;
  /** Canonical replacement events emitted at or after `rollbackToLedger`. */
  replacementEvents?: LeaderboardEvent[];
}

function isValidEvent(event: LeaderboardEvent): boolean {
  if (!event || typeof event !== 'object') return false;
  if (typeof event.id !== 'string' || event.id.trim().length === 0) return false;
  if (typeof event.address !== 'string' || event.address.trim().length === 0) return false;
  if (!Number.isSafeInteger(event.ledger) || event.ledger < 0) return false;
  if (typeof event.volume !== 'number' || !Number.isFinite(event.volume) || event.volume < 0) {
    return false;
  }
  if (
    event.count !== undefined &&
    (!Number.isFinite(event.count) || event.count < 0 || !Number.isInteger(event.count))
  ) {
    return false;
  }
  if (
    event.yieldEarned !== undefined &&
    (typeof event.yieldEarned !== 'number' ||
      !Number.isFinite(event.yieldEarned) ||
      event.yieldEarned < 0)
  ) {
    return false;
  }
  return true;
}

function aggregateLeaderboardEvents(events: LeaderboardEvent[]): {
  rows: LeaderboardAggregateRow[];
  lastIndexedLedger: number | null;
} {
  const byAddress = new Map<
    string,
    { address: string; totalVolume: number; eventCount: number; yieldEarned: number; lastLedger: number }
  >();
  let lastIndexedLedger: number | null = null;

  for (const event of events) {
    const address = event.address.trim();
    const key = address.toUpperCase();
    const countDelta = event.count ?? 1;
    const yieldDelta = event.yieldEarned ?? 0;

    if (lastIndexedLedger === null || event.ledger > lastIndexedLedger) {
      lastIndexedLedger = event.ledger;
    }

    const existing = byAddress.get(key);
    if (existing) {
      existing.totalVolume += event.volume;
      existing.eventCount += countDelta;
      existing.yieldEarned += yieldDelta;
      if (event.ledger > existing.lastLedger) {
        existing.lastLedger = event.ledger;
      }
    } else {
      byAddress.set(key, {
        address,
        totalVolume: event.volume,
        eventCount: countDelta,
        yieldEarned: yieldDelta,
        lastLedger: event.ledger,
      });
    }
  }

  const rows: LeaderboardAggregateRow[] = Array.from(byAddress.values())
    .filter((entry) => entry.eventCount > 0 && entry.totalVolume > 0)
    .sort((a, b) => {
      if (b.totalVolume !== a.totalVolume) return b.totalVolume - a.totalVolume;
      if (b.eventCount !== a.eventCount) return b.eventCount - a.eventCount;
      return a.address.localeCompare(b.address);
    })
    .map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

  return { rows, lastIndexedLedger };
}

/**
 * Builds an initial canonical leaderboard state from a list of events,
 * deduplicating by `event.id` and computing deterministic ranks and totals.
 */
export function createLeaderboardReorgState(
  initialEvents: LeaderboardEvent[] = []
): LeaderboardReorgState {
  const seenIds = new Set<string>();
  const canonical: LeaderboardEvent[] = [];

  for (const event of initialEvents) {
    if (!isValidEvent(event)) continue;
    const id = event.id.trim();
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    canonical.push({ ...event, id, address: event.address.trim() });
  }

  const { rows, lastIndexedLedger } = aggregateLeaderboardEvents(canonical);
  return {
    events: canonical,
    rows,
    lastIndexedLedger,
    rolledBackCount: 0,
  };
}

/**
 * Applies a chain reorg correction to a leaderboard event state:
 * 1. Drops all events at or above `rollbackToLedger` so rolled-back volume and
 *    ranks can never persist as stale state.
 * 2. Applies valid canonical `replacementEvents` at or above `rollbackToLedger`,
 *    deduplicated by `event.id`.
 * 3. Recomputes all ranks and volume totals from scratch.
 *
 * Residual risk:
 * - Client/server callers that consume pre-aggregated snapshots from an external
 *   indexer rely on the indexer's own reorg handling unless they pass `reorgFromLedger`
 *   to `reconcileLeaderboardSnapshot`.
 */
export function applyLeaderboardReorg(
  state: LeaderboardReorgState,
  correction: LeaderboardReorgCorrection
): LeaderboardReorgState {
  if (!Number.isSafeInteger(correction.rollbackToLedger) || correction.rollbackToLedger < 0) {
    throw new RangeError('rollbackToLedger must be a non-negative safe integer');
  }

  const retained: LeaderboardEvent[] = [];
  const seenIds = new Set<string>();
  let rolledBackCount = 0;

  for (const event of state.events) {
    if (event.ledger >= correction.rollbackToLedger) {
      rolledBackCount++;
      continue;
    }
    seenIds.add(event.id);
    retained.push(event);
  }

  for (const event of correction.replacementEvents ?? []) {
    if (!isValidEvent(event)) continue;
    if (event.ledger < correction.rollbackToLedger) continue;
    const id = event.id.trim();
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    retained.push({ ...event, id, address: event.address.trim() });
  }

  const { rows, lastIndexedLedger } = aggregateLeaderboardEvents(retained);
  return {
    events: retained,
    rows,
    lastIndexedLedger,
    rolledBackCount,
  };
}

export interface LeaderboardSnapshot<T extends { address: string }> {
  rows: T[];
  lastIndexedLedger: number | null;
  reorgFromLedger?: number | null;
}

function deduplicateSnapshotRows<T extends { address: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const row of rows) {
    const addr = row.address?.trim();
    if (!addr) continue;
    const key = addr.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

/**
 * Reconciles an incoming leaderboard snapshot against the currently displayed snapshot.
 *
 * - If `incoming.reorgFromLedger` is set, the incoming snapshot unconditionally replaces
 *   the current snapshot even when `incoming.lastIndexedLedger <= current.lastIndexedLedger`
 *   (because a reorg can roll back the chain tip).
 * - Otherwise, stale snapshots with a strictly lower `lastIndexedLedger` are rejected.
 */
export function reconcileLeaderboardSnapshot<T extends { address: string }>(
  current: LeaderboardSnapshot<T> | null,
  incoming: LeaderboardSnapshot<T>
): { rows: T[]; lastIndexedLedger: number | null; replaced: boolean } {
  const hasReorgSignal =
    incoming.reorgFromLedger !== undefined && incoming.reorgFromLedger !== null;

  if (
    !hasReorgSignal &&
    current !== null &&
    current.lastIndexedLedger !== null &&
    incoming.lastIndexedLedger !== null &&
    incoming.lastIndexedLedger < current.lastIndexedLedger
  ) {
    return {
      rows: current.rows,
      lastIndexedLedger: current.lastIndexedLedger,
      replaced: false,
    };
  }

  return {
    rows: deduplicateSnapshotRows(incoming.rows),
    lastIndexedLedger: incoming.lastIndexedLedger,
    replaced: true,
  };
}
