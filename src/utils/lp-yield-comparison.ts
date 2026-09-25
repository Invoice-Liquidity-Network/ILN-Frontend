import type { Invoice } from './soroban';
import { effectiveYieldAnnualizedPct } from './protocol-yield-analytics';

const TOKEN_SYMBOLS = ['USDC', 'EURC', 'XLM'] as const;
export type ComparisonTokenSymbol = (typeof TOKEN_SYMBOLS)[number];

export interface TokenYieldComparisonRow {
  symbol: ComparisonTokenSymbol;
  lpYieldPct: number;
  protocolYieldPct: number;
  tBillYieldPct: number;
  premiumBps: number;
}

function tokenSymbolFromId(tokenId: string | undefined): ComparisonTokenSymbol {
  if (!tokenId) return 'USDC';
  const upper = tokenId.toUpperCase();
  if (upper.includes('EURC')) return 'EURC';
  if (upper.includes('XLM')) return 'XLM';
  return 'USDC';
}

function averageYieldForSymbol(
  invoices: Invoice[],
  symbol: ComparisonTokenSymbol,
  filter?: (inv: Invoice) => boolean
): number {
  const subset = invoices.filter(
    (inv) =>
      inv.status === 'Paid' &&
      inv.funded_at !== undefined &&
      tokenSymbolFromId(inv.token) === symbol &&
      (!filter || filter(inv))
  );
  if (subset.length === 0) return 0;
  const total = subset.reduce((sum, inv) => sum + effectiveYieldAnnualizedPct(inv), 0);
  return total / subset.length;
}

export function buildTokenYieldComparison(
  invoices: Invoice[],
  lpAddress: string,
  tBillYieldPct: number
): TokenYieldComparisonRow[] {
  const settled = invoices.filter((inv) => inv.status === 'Paid' && inv.funded_at !== undefined);

  return TOKEN_SYMBOLS.map((symbol) => {
    const lpYieldPct = averageYieldForSymbol(settled, symbol, (inv) => inv.funder === lpAddress);
    const protocolYieldPct = averageYieldForSymbol(settled, symbol);
    const premiumBps = Math.round((lpYieldPct - tBillYieldPct) * 100);

    return {
      symbol,
      lpYieldPct,
      protocolYieldPct,
      tBillYieldPct,
      premiumBps,
    };
  });
}

export function formatPremiumBps(premiumBps: number): string {
  const sign = premiumBps >= 0 ? '+' : '';
  return `${sign}${premiumBps} bps over risk-free rate`;
}
