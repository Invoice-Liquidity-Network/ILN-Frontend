"use client";

import { useState } from "react";
import {
  INVOICE_STATUSES,
  type DateFilterType,
  type InvoiceFilters,
  type InvoiceStatus,
} from "@/hooks/useInvoiceFilters";

type InvoiceFilterBarProps = {
  filters: InvoiceFilters;
  onFiltersChange: (updater: InvoiceFilters | ((current: InvoiceFilters) => InvoiceFilters)) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  className?: string;
};

const TOKEN_OPTIONS = ["USDC", "EURC", "XLM"] as const;

const DATE_TYPE_LABELS: Record<DateFilterType, string> = {
  due: "Due Date",
  funded: "Funded Date",
};

function toDateStr(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPresetRange(preset: "today" | "week" | "month"): { start: string; end: string } {
  const now = new Date();
  const todayStr = toDateStr(now);

  if (preset === "today") {
    return { start: todayStr, end: todayStr };
  }

  if (preset === "week") {
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
    return { start: toDateStr(weekStart), end: todayStr };
  }

  // month
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { start: toDateStr(monthStart), end: todayStr };
}

function handleStatusKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  const boxes = Array.from(
    e.currentTarget.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
  );
  const idx = boxes.indexOf(document.activeElement as HTMLInputElement);
  if (idx === -1) return;
  const next =
    e.key === "ArrowDown" || e.key === "ArrowRight"
      ? (idx + 1) % boxes.length
      : (idx - 1 + boxes.length) % boxes.length;
  boxes[next]?.focus();
}

export default function InvoiceFilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
  activeFilterCount,
  className,
}: InvoiceFilterBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const containerClass = className ? `space-y-3 ${className}` : "space-y-3";

  const hasDateFilter = Boolean(filters.startDate || filters.endDate);

  function applyPreset(preset: "today" | "week" | "month") {
    const { start, end } = getPresetRange(preset);
    onFiltersChange((current) => ({ ...current, startDate: start, endDate: end }));
  }

  function clearDateFilter() {
    onFiltersChange((current) => ({ ...current, startDate: "", endDate: "" }));
  }

  return (
    <div className={containerClass}>
      {/* Screen reader live region */}
      <div role="status" aria-live="polite" className="sr-only">
        {activeFilterCount > 0
          ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} applied`
          : "No filters applied"}
      </div>

      <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center">
        <input
          type="search"
          value={filters.search}
          placeholder="Search by invoice ID, payer, or freelancer address"
          onChange={(event) => {
            const value = event.target.value;
            onFiltersChange((current) => ({ ...current, search: value }));
          }}
          className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen((current) => !current)}
            aria-expanded={isAdvancedOpen}
            aria-controls="invoice-filter-advanced"
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-medium text-on-surface-variant hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-bold uppercase tracking-wide text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
            >
              Clear all filters
            </button>
          ) : null}
        </div>
      </div>

      {isAdvancedOpen ? (
        <div
          id="invoice-filter-advanced"
          className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p
                id="status-group-label"
                className="text-xs font-bold uppercase tracking-wide text-on-surface-variant"
              >
                Status
              </p>
              <div
                role="group"
                aria-labelledby="status-group-label"
                className="grid grid-cols-2 gap-2"
                onKeyDown={handleStatusKeyDown}
              >
                {INVOICE_STATUSES.map((status) => (
                  <label key={status} className="inline-flex items-center gap-2 text-xs text-on-surface">
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={(event) =>
                        onFiltersChange((current) => {
                          const statuses = new Set<InvoiceStatus>(current.statuses);
                          if (event.target.checked) {
                            statuses.add(status);
                          } else {
                            statuses.delete(status);
                          }
                          return { ...current, statuses: Array.from(statuses) };
                        })
                      }
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Amount (USDC)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  aria-label="Minimum amount (USDC)"
                  min="0"
                  step="0.01"
                  value={filters.minAmount}
                  placeholder="Min"
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, minAmount: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  aria-label="Maximum amount (USDC)"
                  min="0"
                  step="0.01"
                  value={filters.maxAmount}
                  placeholder="Max"
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, maxAmount: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Date range picker with type selector and quick presets */}
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  Date Range
                </p>
                {hasDateFilter && (
                  <button
                    type="button"
                    onClick={clearDateFilter}
                    className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                  >
                    Clear date
                  </button>
                )}
              </div>

              {/* Date type selector */}
              <div className="flex gap-1 rounded-lg bg-surface-container-high p-0.5">
                {(["due", "funded"] as DateFilterType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      onFiltersChange((current) => ({ ...current, dateType: type }))
                    }
                    className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                      filters.dateType === type
                        ? "bg-primary text-white shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {DATE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              {/* Quick presets */}
              <div className="flex gap-1.5">
                {(["today", "week", "month"] as const).map((preset) => {
                  const label = preset === "today" ? "Today" : preset === "week" ? "This Week" : "This Month";
                  const { start, end } = getPresetRange(preset);
                  const isActive = filters.startDate === start && filters.endDate === end;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => (isActive ? clearDateFilter() : applyPreset(preset))}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-all ${
                        isActive
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-primary/30 hover:text-primary"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Custom date inputs */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  aria-label={`${DATE_TYPE_LABELS[filters.dateType]} from`}
                  value={filters.startDate}
                  max={filters.endDate || undefined}
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, startDate: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  aria-label={`${DATE_TYPE_LABELS[filters.dateType]} to`}
                  value={filters.endDate}
                  min={filters.startDate || undefined}
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, endDate: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Token</p>
              <select
                aria-label="Token filter"
                value={filters.token}
                onChange={(event) => onFiltersChange((current) => ({ ...current, token: event.target.value }))}
                className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {TOKEN_OPTIONS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Discount (bps)</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  aria-label="Minimum discount (bps)"
                  min="0"
                  step="1"
                  value={filters.minDiscountBps}
                  placeholder="Min"
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, minDiscountBps: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  aria-label="Maximum discount (bps)"
                  min="0"
                  step="1"
                  value={filters.maxDiscountBps}
                  placeholder="Max"
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, maxDiscountBps: event.target.value }))
                  }
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Min Payer Reputation
              </p>
              <div className="space-y-2">
                <input
                  type="range"
                  aria-label="Minimum payer reputation"
                  min="0"
                  max="100"
                  step="5"
                  value={filters.minPayerReputation || "0"}
                  onChange={(event) =>
                    onFiltersChange((current) => ({ ...current, minPayerReputation: event.target.value }))
                  }
                  className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>0</span>
                  <span className="font-semibold text-on-surface">
                    {filters.minPayerReputation || "0"}
                  </span>
                  <span>100</span>
                </div>
                {filters.minPayerReputation && Number(filters.minPayerReputation) > 0 && (
                  <p className="text-xs text-on-surface-variant">
                    Only showing invoices from payers with reputation ≥ {filters.minPayerReputation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
