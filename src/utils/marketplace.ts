import type { Invoice, PayerScoreResult } from "./soroban";

export type MarketplaceSortKey = "yield" | "amount" | "due_date";

export interface MarketplaceFilters {
  token: string;
  minYield: number;
  maxAmount: string;
  minReputation: number;
}

export function effectiveYieldPercent(invoice: Invoice): number {
  return invoice.discount_rate / 100;
}

function amountWithinLimit(invoice: Invoice, maxAmount: string, decimals = 7): boolean {
  if (!maxAmount.trim()) return true;
  const parsed = Number(maxAmount);
  if (!Number.isFinite(parsed) || parsed <= 0) return true;
  const limit = BigInt(Math.floor(parsed * 10 ** decimals));
  return invoice.amount <= limit;
}

export function filterMarketplaceInvoices({
  invoices,
  filters,
  payerScores,
}: {
  invoices: Invoice[];
  filters: MarketplaceFilters;
  payerScores: Map<string, PayerScoreResult | null>;
}) {
  return invoices.filter((invoice) => {
    if (invoice.status !== "Pending") return false;
    if (filters.token && invoice.token !== filters.token) return false;
    if (effectiveYieldPercent(invoice) < filters.minYield) return false;
    if (!amountWithinLimit(invoice, filters.maxAmount)) return false;

    const score = payerScores.get(invoice.payer)?.score ?? 0;
    if (score < filters.minReputation) return false;

    return true;
  });
}

export function sortMarketplaceInvoices(invoices: Invoice[], sortKey: MarketplaceSortKey) {
  return [...invoices].sort((a, b) => {
    if (sortKey === "yield") {
      return b.discount_rate - a.discount_rate;
    }
    if (sortKey === "amount") {
      if (a.amount === b.amount) return 0;
      return a.amount > b.amount ? -1 : 1;
    }
    if (a.due_date === b.due_date) return 0;
    return a.due_date < b.due_date ? -1 : 1;
  });
}

export function paginateMarketplaceInvoices(invoices: Invoice[], page: number, pageSize: number) {
  const safePage = Math.max(0, page);
  const safePageSize = Math.max(1, pageSize);
  const start = safePage * safePageSize;
  return invoices.slice(start, start + safePageSize);
}
