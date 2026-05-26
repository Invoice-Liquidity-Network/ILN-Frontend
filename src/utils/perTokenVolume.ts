export type VolumeToken = "USDC" | "EURC" | "XLM";
export type VolumeTimeRange = "30D" | "90D";

export interface PerTokenVolumeBucket {
  weekStart: string;
  label: string;
  USDC: number;
  EURC: number;
  XLM: number;
  totalUsd: number;
}

export interface PerTokenVolumeSummary {
  totalUsd: number;
  USDC: number;
  EURC: number;
  XLM: number;
}

export interface PerTokenVolumeResult {
  buckets: PerTokenVolumeBucket[];
  summary: PerTokenVolumeSummary;
}

const TOKENS: VolumeToken[] = ["USDC", "EURC", "XLM"];
const DEFAULT_PRICES: Record<VolumeToken, number> = {
  USDC: 1,
  EURC: 1.08,
  XLM: 0.12,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeToken(value: unknown): VolumeToken | null {
  const symbol = String(value ?? "").toUpperCase();
  return TOKENS.includes(symbol as VolumeToken) ? (symbol as VolumeToken) : null;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    if (key in record) return toNumber(record[key]);
  }
  return 0;
}

function getPrice(stats: Record<string, unknown>, token: VolumeToken): number {
  const priceContainers = [
    stats.oracle_prices,
    stats.oraclePrices,
    stats.prices_usd,
    stats.pricesUsd,
  ];

  for (const container of priceContainers) {
    if (!isRecord(container)) continue;
    const price = toNumber(container[token] ?? container[token.toLowerCase()]);
    if (price > 0) return price;
  }

  return DEFAULT_PRICES[token];
}

function getWeekStart(dateValue: unknown): string {
  const source = typeof dateValue === "string" ? dateValue : new Date().toISOString();
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);

  const day = date.getUTCDay();
  const distanceFromMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - distanceFromMonday);
  return date.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function createBucket(weekStart: string): PerTokenVolumeBucket {
  return {
    weekStart,
    label: formatWeekLabel(weekStart),
    USDC: 0,
    EURC: 0,
    XLM: 0,
    totalUsd: 0,
  };
}

function readWeeklyRows(stats: Record<string, unknown>): unknown[] {
  const candidates = [
    stats.weekly_token_volume,
    stats.weeklyTokenVolume,
    stats.per_token_weekly_volume,
    stats.perTokenWeeklyVolume,
    stats.token_volumes_by_week,
    stats.tokenVolumesByWeek,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function addWeeklyRow(
  bucketMap: Map<string, PerTokenVolumeBucket>,
  row: Record<string, unknown>,
  stats: Record<string, unknown>,
) {
  const weekStart = getWeekStart(row.week ?? row.week_start ?? row.weekStart ?? row.date);
  const bucket = bucketMap.get(weekStart) ?? createBucket(weekStart);

  const explicitToken = normalizeToken(row.token ?? row.symbol);
  if (explicitToken) {
    const amount = pickNumber(row, ["amount", "volume", "volume_native", "nativeVolume"]);
    const usd = pickNumber(row, ["usd", "volume_usd", "usd_equiv", "usdEquivalent"]);
    bucket[explicitToken] += usd > 0 ? usd : amount * getPrice(stats, explicitToken);
  } else {
    for (const token of TOKENS) {
      const amount = pickNumber(row, [
        token,
        token.toLowerCase(),
        `${token}_volume`,
        `${token.toLowerCase()}_volume`,
        `${token}_usd`,
        `${token.toLowerCase()}_usd`,
      ]);
      bucket[token] += amount;
    }
  }

  bucket.totalUsd = TOKENS.reduce((sum, token) => sum + bucket[token], 0);
  bucketMap.set(weekStart, bucket);
}

function buildFlatAllTimeBucket(stats: Record<string, unknown>): PerTokenVolumeBucket | null {
  const weekStart = getWeekStart(stats.indexed_at ?? stats.updated_at ?? stats.timestamp);
  const bucket = createBucket(weekStart);

  for (const token of TOKENS) {
    const nativeVolume = pickNumber(stats, [
      `${token}_volume`,
      `${token.toLowerCase()}_volume`,
      `${token}_volume_funded`,
      `${token.toLowerCase()}_volume_funded`,
      `${token}_total_volume`,
      `${token.toLowerCase()}_total_volume`,
    ]);
    const usdVolume = pickNumber(stats, [
      `${token}_volume_usd`,
      `${token.toLowerCase()}_volume_usd`,
      `${token}_usd_volume`,
      `${token.toLowerCase()}_usd_volume`,
    ]);
    bucket[token] = usdVolume > 0 ? usdVolume : nativeVolume * getPrice(stats, token);
  }

  bucket.totalUsd = TOKENS.reduce((sum, token) => sum + bucket[token], 0);
  return bucket.totalUsd > 0 ? bucket : null;
}

function filterBuckets(
  buckets: PerTokenVolumeBucket[],
  range: VolumeTimeRange,
  now = new Date(),
): PerTokenVolumeBucket[] {
  const days = range === "30D" ? 30 : 90;
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  return buckets
    .filter((bucket) => new Date(`${bucket.weekStart}T00:00:00Z`) >= cutoff)
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

function summarize(buckets: PerTokenVolumeBucket[]): PerTokenVolumeSummary {
  const summary: PerTokenVolumeSummary = {
    totalUsd: 0,
    USDC: 0,
    EURC: 0,
    XLM: 0,
  };

  for (const bucket of buckets) {
    for (const token of TOKENS) {
      summary[token] += bucket[token];
    }
    summary.totalUsd += bucket.totalUsd;
  }

  return summary;
}

export function transformPerTokenVolumeStats(
  rawStats: unknown,
  range: VolumeTimeRange,
  now = new Date(),
): PerTokenVolumeResult {
  if (!isRecord(rawStats)) {
    return { buckets: [], summary: summarize([]) };
  }

  const bucketMap = new Map<string, PerTokenVolumeBucket>();
  for (const row of readWeeklyRows(rawStats)) {
    if (isRecord(row)) addWeeklyRow(bucketMap, row, rawStats);
  }

  if (bucketMap.size === 0) {
    const flatBucket = buildFlatAllTimeBucket(rawStats);
    if (flatBucket) bucketMap.set(flatBucket.weekStart, flatBucket);
  }

  const buckets = filterBuckets([...bucketMap.values()], range, now);
  return {
    buckets,
    summary: summarize(buckets),
  };
}
