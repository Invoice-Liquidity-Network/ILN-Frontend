/**
 * Rate freshness assertions and status tracking (#1140).
 * Prevents users from mistaking cached or stale rates for live market data.
 */

export class StaleRateError extends Error {
  constructor(
    message: string,
    public readonly ageMs: number,
    public readonly maxAgeMs: number,
  ) {
    super(message);
    this.name = 'StaleRateError';
  }
}

export interface RateFreshnessOptions {
  /** Maximum acceptable age in milliseconds before a rate is considered stale */
  maxAgeMs?: number;
  /** Current time in ms (useful for deterministic testing) */
  now?: number;
  /** Label for logging and error reporting */
  metricName?: string;
}

export interface FreshnessEvaluation {
  isStale: boolean;
  ageMs: number;
  ageSeconds: number;
  statusText: string;
  badgeTone: 'fresh' | 'stale' | 'expired';
}

export const DEFAULT_RATE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes default for financial rate displays

export function evaluateRateFreshness(
  timestampOrIso: number | string | Date,
  options: RateFreshnessOptions = {},
): FreshnessEvaluation {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_RATE_MAX_AGE_MS;
  const now = options.now ?? Date.now();
  const timeMs =
    typeof timestampOrIso === 'number'
      ? timestampOrIso
      : new Date(timestampOrIso).getTime();

  const ageMs = Math.max(0, now - timeMs);
  const ageSeconds = Math.floor(ageMs / 1000);
  const isStale = ageMs > maxAgeMs;

  let badgeTone: 'fresh' | 'stale' | 'expired' = 'fresh';
  let statusText = 'Live';

  if (ageMs > maxAgeMs * 2) {
    badgeTone = 'expired';
    statusText = `Expired (${Math.floor(ageSeconds / 60)}m ago)`;
  } else if (isStale) {
    badgeTone = 'stale';
    statusText = `Cached (${Math.floor(ageSeconds / 60)}m ago)`;
  }

  return {
    isStale,
    ageMs,
    ageSeconds,
    statusText,
    badgeTone,
  };
}

export function assertRateFreshness(
  timestampOrIso: number | string | Date,
  options: RateFreshnessOptions = {},
): void {
  const evaluation = evaluateRateFreshness(timestampOrIso, options);
  if (evaluation.isStale) {
    const metric = options.metricName ?? 'Rate';
    throw new StaleRateError(
      `${metric} is stale: age ${evaluation.ageSeconds}s exceeds threshold of ${(options.maxAgeMs ?? DEFAULT_RATE_MAX_AGE_MS) / 1000}s`,
      evaluation.ageMs,
      options.maxAgeMs ?? DEFAULT_RATE_MAX_AGE_MS,
    );
  }
}
