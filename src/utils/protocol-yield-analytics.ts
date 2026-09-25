import type { Invoice } from './soroban';

const TOKEN_SYMBOLS = ['USDC', 'EURC', 'XLM'] as const;
export type YieldTokenSymbol = (typeof TOKEN_SYMBOLS)[number];

export interface YieldByTokenRow {
  symbol: YieldTokenSymbol;
  avgEffectiveYieldPct: number;
  invoiceCount: number;
}

export interface YieldExtremeInvoice {
  id: string;
  symbol: YieldTokenSymbol;
  effectiveYieldPct: number;
  discountRatePct: number;
}

export interface ProtocolYieldMetrics {
  avgEffectiveYield30d: number;
  medianDiscountRatePct: number;
  yieldByToken: YieldByTokenRow[];
  highestThisWeek: YieldExtremeInvoice | null;
  lowestThisWeek: YieldExtremeInvoice | null;
}

export interface YieldTrendPoint {
  date: string;
  isoDate: string;
  avgYieldPct: number;
}

function tokenSymbolFromId(tokenId: string | undefined): YieldTokenSymbol {
  if (!tokenId) return 'USDC';
  const upper = tokenId.toUpperCase();
  if (upper.includes('EURC')) return 'EURC';
  if (upper.includes('XLM')) return 'XLM';
  return 'USDC';
}

/** Annualized effective yield from discount bps and funded-to-due tenure. */
export function effectiveYieldAnnualizedPct(inv: Invoice): number {
  if (!inv.funded_at) {
    return inv.discount_rate / 100;
  }
  const tenureDays = Math.max(1, (Number(inv.due_date) - Number(inv.funded_at)) / 86_400);
  return (inv.discount_rate / 10_000) * (365 / tenureDays) * 100;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Settled invoices: funded and paid (InvoiceFunded → InvoicePaid lifecycle). */
export function getSettledInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter((inv) => inv.status === 'Paid' && inv.funded_at !== undefined);
}

export function computeProtocolYieldMetrics(invoices: Invoice[]): ProtocolYieldMetrics {
  const nowSec = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = nowSec - 30 * 86_400;
  const weekStartSec = nowSec - 7 * 86_400;

  const settled = getSettledInvoices(invoices);
  const settled30d = settled.filter((inv) => Number(inv.funded_at!) >= thirtyDaysAgo);
  const fundedThisWeek = settled.filter((inv) => Number(inv.funded_at!) >= weekStartSec);

  const yieldByToken: YieldByTokenRow[] = TOKEN_SYMBOLS.map((symbol) => {
    const tokenInvoices = settled30d.filter((inv) => tokenSymbolFromId(inv.token) === symbol);
    return {
      symbol,
      avgEffectiveYieldPct: average(tokenInvoices.map((inv) => effectiveYieldAnnualizedPct(inv))),
      invoiceCount: tokenInvoices.length,
    };
  });

  const weekExtremes = fundedThisWeek
    .map((inv) => ({
      id: inv.id.toString(),
      symbol: tokenSymbolFromId(inv.token),
      effectiveYieldPct: effectiveYieldAnnualizedPct(inv),
      discountRatePct: inv.discount_rate / 100,
    }))
    .sort((a, b) => b.effectiveYieldPct - a.effectiveYieldPct);

  return {
    avgEffectiveYield30d: average(settled30d.map((inv) => effectiveYieldAnnualizedPct(inv))),
    medianDiscountRatePct: median(settled.map((inv) => inv.discount_rate / 100)),
    yieldByToken,
    highestThisWeek: weekExtremes[0] ?? null,
    lowestThisWeek: weekExtremes[weekExtremes.length - 1] ?? null,
  };
}

function dayKey(tsSec: number): string {
  return new Date(tsSec * 1000).toISOString().slice(0, 10);
}

/** Daily average effective yield for the last 90 days (for line chart). */
export function buildProtocolYieldTrend(invoices: Invoice[], days = 90): YieldTrendPoint[] {
  const nowSec = Math.floor(Date.now() / 1000);
  const cutoff = nowSec - days * 86_400;
  const settled = getSettledInvoices(invoices).filter((inv) => Number(inv.funded_at!) >= cutoff);

  const buckets = new Map<string, number[]>();
  for (const inv of settled) {
    const key = dayKey(Number(inv.funded_at!));
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(effectiveYieldAnnualizedPct(inv));
  }

  const points: YieldTrendPoint[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([isoDate, yields]) => ({
      isoDate,
      date: new Date(isoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
      avgYieldPct: average(yields),
    }));

  return points;
}
