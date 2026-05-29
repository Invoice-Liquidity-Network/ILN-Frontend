import type { Invoice } from "@/utils/soroban";

export type LPRiskFilter = "all" | "at-risk" | "disputed";

export interface LPRiskMetrics {
  positionsAtRisk: number;
  capitalAtRisk: bigint;
  disputedPositions: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RISK_WINDOW_MS = DAY_MS;

export function isDisputedPosition(invoice: Invoice): boolean {
  return invoice.status.toLowerCase() === "disputed";
}

export function isNearingExpiry(invoice: Invoice, now = Date.now()): boolean {
  if (invoice.status !== "Funded") return false;
  const dueAt = Number(invoice.due_date) * 1000;
  return dueAt <= now + RISK_WINDOW_MS;
}

export function isAtRiskPosition(invoice: Invoice, now = Date.now()): boolean {
  return isDisputedPosition(invoice) || isNearingExpiry(invoice, now);
}

export function calculateLPRiskMetrics(
  invoices: Invoice[],
  now = Date.now(),
): LPRiskMetrics {
  return invoices.reduce<LPRiskMetrics>(
    (metrics, invoice) => {
      const disputed = isDisputedPosition(invoice);
      const atRisk = disputed || isNearingExpiry(invoice, now);

      if (atRisk) {
        metrics.positionsAtRisk += 1;
        metrics.capitalAtRisk += invoice.amount;
      }
      if (disputed) {
        metrics.disputedPositions += 1;
      }

      return metrics;
    },
    {
      positionsAtRisk: 0,
      capitalAtRisk: 0n,
      disputedPositions: 0,
    },
  );
}

export function applyLPRiskFilter(
  invoices: Invoice[],
  filter: LPRiskFilter,
  now = Date.now(),
): Invoice[] {
  if (filter === "all") return invoices;
  if (filter === "disputed") return invoices.filter(isDisputedPosition);
  return invoices.filter((invoice) => isAtRiskPosition(invoice, now));
}

export function getRiskSeverity(value: number): "green" | "amber" | "red" {
  if (value === 0) return "green";
  if (value <= 2) return "amber";
  return "red";
}
