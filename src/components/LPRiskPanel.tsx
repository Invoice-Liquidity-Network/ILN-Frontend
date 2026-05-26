"use client";

import type { Invoice } from "@/utils/soroban";
import { formatUSDC } from "@/utils/format";
import {
  calculateLPRiskMetrics,
  getRiskSeverity,
  type LPRiskFilter,
} from "@/utils/lpRisk";

interface LPRiskPanelProps {
  invoices: Invoice[];
  activeFilter: LPRiskFilter;
  onFilterChange: (filter: LPRiskFilter) => void;
  now: number;
}

const SEVERITY_CLASSES = {
  green: "border-green-500/20 bg-green-500/10 text-green-700",
  amber: "border-amber-500/25 bg-amber-500/10 text-amber-700",
  red: "border-red-500/25 bg-red-500/10 text-red-700",
} as const;

function MetricButton({
  icon,
  label,
  value,
  sub,
  severity,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  severity: keyof typeof SEVERITY_CLASSES;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
        SEVERITY_CLASSES[severity]
      } ${active ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
          {label}
        </span>
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-3 font-headline text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{sub}</p>
    </button>
  );
}

export default function LPRiskPanel({
  invoices,
  activeFilter,
  onFilterChange,
  now,
}: LPRiskPanelProps) {
  const metrics = calculateLPRiskMetrics(invoices, now);

  const toggleFilter = (filter: LPRiskFilter) => {
    onFilterChange(activeFilter === filter ? "all" : filter);
  };

  return (
    <section
      aria-labelledby="lp-risk-panel-heading"
      className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h3 id="lp-risk-panel-heading" className="font-headline text-xl font-bold text-on-surface">
            Position Risk
          </h3>
          <p className="text-sm text-on-surface-variant">
            Flags disputed positions and funded invoices due within 24 hours.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">
            refresh
          </span>
          Refreshes with portfolio data
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MetricButton
          icon="warning"
          label="Positions at Risk"
          value={metrics.positionsAtRisk.toLocaleString()}
          sub="Disputed or due in under 24h"
          severity={getRiskSeverity(metrics.positionsAtRisk)}
          active={activeFilter === "at-risk"}
          onClick={() => toggleFilter("at-risk")}
        />
        <MetricButton
          icon="account_balance_wallet"
          label="Capital at Risk"
          value={formatUSDC(metrics.capitalAtRisk)}
          sub="Funded amount in at-risk positions"
          severity={getRiskSeverity(metrics.positionsAtRisk)}
          active={activeFilter === "at-risk"}
          onClick={() => toggleFilter("at-risk")}
        />
        <MetricButton
          icon="gavel"
          label="Disputed Positions"
          value={metrics.disputedPositions.toLocaleString()}
          sub="Positions with disputed status"
          severity={getRiskSeverity(metrics.disputedPositions)}
          active={activeFilter === "disputed"}
          onClick={() => toggleFilter("disputed")}
        />
      </div>

      {activeFilter !== "all" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm">
          <span className="font-medium text-on-surface">
            Filtering table to {activeFilter === "disputed" ? "disputed positions" : "at-risk positions"}.
          </span>
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className="text-xs font-bold text-primary hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}
    </section>
  );
}
