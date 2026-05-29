import {
  TESTNET_EURC_TOKEN_ID,
  TESTNET_USDC_TOKEN_ID,
  TESTNET_XLM_TOKEN_ID,
} from "@/constants";
import type { Invoice, ProtocolContractStats } from "./soroban";

export type TokenSymbol = "USDC" | "EURC" | "XLM";
export type TokenVolumeRange = 30 | 90;

export interface TokenVolumeBucket {
  weekStart: string;
  label: string;
  USDC: number;
  EURC: number;
  XLM: number;
  totalUsd: number;
}

export interface TokenVolumeSummary {
  totalUsd: number;
  totals: Record<TokenSymbol, number>;
}

export interface TokenVolumeResult {
  buckets: TokenVolumeBucket[];
  summary: TokenVolumeSummary;
}

const TOKEN_SYMBOLS: TokenSymbol[] = ["USDC", "EURC", "XLM"];

const TOKEN_DECIMALS: Record<TokenSymbol, number> = {
  USDC: 6,
  EURC: 7,
  XLM: 7,
};

const FALLBACK_USD_PRICES: Record<TokenSymbol, number> = {
  USDC: 1,
  EURC: 1.08,
  XLM: 0.15,
};

const TOKEN_ID_TO_SYMBOL: Record<string, TokenSymbol> = {
  [TESTNET_USDC_TOKEN_ID]: "USDC",
  [TESTNET_EURC_TOKEN_ID]: "EURC",
  [TESTNET_XLM_TOKEN_ID]: "XLM",
};

const WEEKLY_FIELD_NAMES = [
  "weekly_per_token_volume",
  "weekly_token_volume",
  "token_weekly_volume",
  "per_token_weekly_volume",
  "per_token_volume_by_week",
  "per_token_volumes_by_week",
];

const TOTAL_FIELD_NAMES = [
  "per_token_volume",
  "per_token_volumes",
  "token_volume",
  "token_volumes",
  "volume_by_token",
];

export function buildPerTokenVolumeData({
  stats,
  invoices = [],
  rangeDays,
  now = new Date(),
}: {
  stats?: ProtocolContractStats | null;
  invoices?: Invoice[];
  rangeDays: TokenVolumeRange;
  now?: Date;
}): TokenVolumeResult {
  const prices = readOraclePrices(stats);
  const cutoff = getCutoffDate(now, rangeDays);
  const rows =
    readWeeklyBuckets(stats, cutoff, prices) ??
    readAllTimeTotals(stats, now, prices) ??
    readInvoiceBuckets(invoices, cutoff, prices);

  return {
    buckets: rows,
    summary: summarizeBuckets(rows),
  };
}

function readWeeklyBuckets(
  stats: ProtocolContractStats | null | undefined,
  cutoff: Date,
  prices: Record<TokenSymbol, number>,
): TokenVolumeBucket[] | null {
  if (!stats) return null;

  for (const field of WEEKLY_FIELD_NAMES) {
    const raw = stats[field];
    const entries = normalizeEntries(raw);
    if (!entries.length) continue;

    const buckets = entries
      .map((entry) => bucketFromEntry(entry, prices))
      .filter((bucket): bucket is TokenVolumeBucket => Boolean(bucket))
      .filter((bucket) => new Date(bucket.weekStart) >= cutoff)
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    if (buckets.length) return buckets;
  }

  return null;
}

function readAllTimeTotals(
  stats: ProtocolContractStats | null | undefined,
  now: Date,
  prices: Record<TokenSymbol, number>,
): TokenVolumeBucket[] | null {
  if (!stats) return null;

  for (const field of TOTAL_FIELD_NAMES) {
    const raw = stats[field];
    const volumes = readVolumeRecord(raw);
    if (!volumes) continue;

    return [
      finalizeBucket({
        weekStart: startOfWeek(now).toISOString().slice(0, 10),
        label: "All-time",
        volumes,
        prices,
      }),
    ];
  }

  return null;
}

function readInvoiceBuckets(
  invoices: Invoice[],
  cutoff: Date,
  prices: Record<TokenSymbol, number>,
): TokenVolumeBucket[] {
  const byWeek = new Map<string, Record<TokenSymbol, number>>();

  invoices
    .filter((invoice) => invoice.status === "Funded" || invoice.status === "Paid")
    .forEach((invoice) => {
      const timestamp = invoice.funded_at ?? invoice.due_date;
      if (!timestamp) return;

      const date = new Date(Number(timestamp) * 1000);
      if (date < cutoff) return;

      const symbol = normalizeTokenSymbol(invoice.token);
      const weekStart = startOfWeek(date).toISOString().slice(0, 10);
      const volumes = byWeek.get(weekStart) ?? emptyVolumes();
      volumes[symbol] += toNativeAmount(invoice.amount, symbol);
      byWeek.set(weekStart, volumes);
    });

  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, volumes]) =>
      finalizeBucket({
        weekStart,
        label: formatWeekLabel(weekStart),
        volumes,
        prices,
      }),
    );
}

function bucketFromEntry(
  entry: Record<string, unknown>,
  prices: Record<TokenSymbol, number>,
): TokenVolumeBucket | null {
  const weekStart = readWeekStart(entry);
  if (!weekStart) return null;

  const volumes = readVolumeRecord(entry.volumes ?? entry.tokens ?? entry) ?? emptyVolumes();

  return finalizeBucket({
    weekStart,
    label: String(entry.label ?? formatWeekLabel(weekStart)),
    volumes,
    prices,
  });
}

function finalizeBucket({
  weekStart,
  label,
  volumes,
  prices,
}: {
  weekStart: string;
  label: string;
  volumes: Record<TokenSymbol, number>;
  prices: Record<TokenSymbol, number>;
}): TokenVolumeBucket {
  const bucket = {
    weekStart,
    label,
    USDC: volumes.USDC * prices.USDC,
    EURC: volumes.EURC * prices.EURC,
    XLM: volumes.XLM * prices.XLM,
    totalUsd: TOKEN_SYMBOLS.reduce(
      (sum, symbol) => sum + volumes[symbol] * prices[symbol],
      0,
    ),
  };

  return bucket;
}

function summarizeBuckets(buckets: TokenVolumeBucket[]): TokenVolumeSummary {
  return buckets.reduce<TokenVolumeSummary>(
    (summary, bucket) => ({
      totalUsd: summary.totalUsd + bucket.totalUsd,
      totals: {
        USDC: summary.totals.USDC + bucket.USDC,
        EURC: summary.totals.EURC + bucket.EURC,
        XLM: summary.totals.XLM + bucket.XLM,
      },
    }),
    { totalUsd: 0, totals: emptyVolumes() },
  );
}

function normalizeEntries(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter(isRecord);
  }

  if (isRecord(raw)) {
    return Object.entries(raw).map(([key, value]) =>
      isRecord(value) ? { weekStart: key, ...value } : { weekStart: key, volumes: value },
    );
  }

  return [];
}

function readVolumeRecord(raw: unknown): Record<TokenSymbol, number> | null {
  if (!raw) return null;

  const volumes = emptyVolumes();

  if (Array.isArray(raw)) {
    raw.forEach((entry) => {
      if (!isRecord(entry)) return;
      const symbol = normalizeTokenSymbol(entry.symbol ?? entry.token ?? entry.token_id);
      volumes[symbol] += toNativeAmount(
        entry.volume ?? entry.amount ?? entry.total_volume ?? entry.value ?? 0,
        symbol,
      );
    });

    return hasVolume(volumes) ? volumes : null;
  }

  if (!isRecord(raw)) return null;

  Object.entries(raw).forEach(([key, value]) => {
    const symbol = normalizeTokenSymbol(key);
    volumes[symbol] += toNativeAmount(value, symbol);
  });

  return hasVolume(volumes) ? volumes : null;
}

function readOraclePrices(stats: ProtocolContractStats | null | undefined): Record<TokenSymbol, number> {
  const prices = { ...FALLBACK_USD_PRICES };
  const raw = stats?.oracle_prices ?? stats?.prices ?? stats?.token_prices;
  if (!isRecord(raw)) return prices;

  Object.entries(raw).forEach(([key, value]) => {
    const symbol = normalizeTokenSymbol(key);
    const numeric = toNumber(value);
    if (numeric > 0) prices[symbol] = numeric;
  });

  return prices;
}

function readWeekStart(entry: Record<string, unknown>): string | null {
  const raw =
    entry.weekStart ??
    entry.week_start ??
    entry.week ??
    entry.date ??
    entry.start_date ??
    entry.timestamp ??
    entry.ledger_time;

  if (typeof raw === "number" || typeof raw === "bigint") {
    return startOfWeek(new Date(Number(raw) * 1000)).toISOString().slice(0, 10);
  }

  if (typeof raw === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return startOfWeek(date).toISOString().slice(0, 10);
  }

  return null;
}

function normalizeTokenSymbol(value: unknown): TokenSymbol {
  const text = String(value ?? "USDC").trim().toUpperCase();
  if (text in TOKEN_ID_TO_SYMBOL) return TOKEN_ID_TO_SYMBOL[text];
  if (text.includes("EURC")) return "EURC";
  if (text.includes("XLM") || text === "NATIVE") return "XLM";
  return "USDC";
}

function toNativeAmount(value: unknown, symbol: TokenSymbol): number {
  const numeric = toNumber(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric / 10 ** TOKEN_DECIMALS[symbol];
}

function toNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function getCutoffDate(now: Date, rangeDays: TokenVolumeRange): Date {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - rangeDays);
  return cutoff;
}

function formatWeekLabel(weekStart: string): string {
  const date = new Date(weekStart);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function emptyVolumes(): Record<TokenSymbol, number> {
  return { USDC: 0, EURC: 0, XLM: 0 };
}

function hasVolume(volumes: Record<TokenSymbol, number>): boolean {
  return TOKEN_SYMBOLS.some((symbol) => volumes[symbol] > 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
