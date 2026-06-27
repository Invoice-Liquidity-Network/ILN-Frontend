"use client";

import { useState, useEffect, useRef } from "react";
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
const SAVED_FILTERS_KEY = "iln_saved_invoice_filters";

type SavedFilter = {
  id: string;
  name: string;
  filters: InvoiceFilters;
};

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
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false);
  const [isSavingFilter, setIsSavingFilter] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");
  const savedFiltersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_FILTERS_KEY);
      if (stored) {
        setSavedFilters(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved filters", e);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (savedFiltersRef.current && !savedFiltersRef.current.contains(event.target as Node)) {
        setIsSavedFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveFilter = () => {
    if (!newFilterName.trim() || savedFilters.length >= 10) return;

    const newFilter: SavedFilter = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      name: newFilterName.trim(),
      filters: { ...filters },
    };

    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updatedFilters));
    setNewFilterName("");
    setIsSavingFilter(false);
  };

  const applySavedFilter = (id: string) => {
    const filter = savedFilters.find((f) => f.id === id);
    if (filter) {
      onFiltersChange(filter.filters);
    }
  };

  const deleteSavedFilter = (id: string) => {
    const updatedFilters = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updatedFilters);
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updatedFilters));
  };

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

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" ref={savedFiltersRef}>
            <button
              type="button"
              onClick={() => setIsSavedFiltersOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-medium text-on-surface-variant hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Saved Filters
              {savedFilters.length > 0 && (
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-bold text-on-surface-variant">
                  {savedFilters.length}
                </span>
              )}
            </button>
            {isSavedFiltersOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-outline-variant/20 bg-surface-container-low p-2 shadow-lg z-10">
                {savedFilters.length === 0 ? (
                  <p className="text-sm text-on-surface-variant p-2 text-center">No saved filters.</p>
                ) : (
                  <ul className="space-y-1">
                    {savedFilters.map((sf) => (
                      <li key={sf.id} className="flex items-center justify-between gap-2 p-1 hover:bg-surface-container-high rounded-lg group">
                        <button
                          type="button"
                          className="flex-1 text-left text-sm truncate px-2 py-1"
                          onClick={() => {
                            applySavedFilter(sf.id);
                            setIsSavedFiltersOpen(false);
                          }}
                        >
                          {sf.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedFilter(sf.id)}
                          className="text-on-surface-variant hover:text-error p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          aria-label={`Delete ${sf.name}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

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
          className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 space-y-4"
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
          
          <div className="mt-4 flex items-center gap-4 pt-4 border-t border-outline-variant/20">
            {isSavingFilter ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="Filter name"
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-1.5 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={saveFilter}
                  disabled={!newFilterName.trim() || savedFilters.length >= 10}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSavingFilter(false);
                    setNewFilterName("");
                  }}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSavingFilter(true)}
                  disabled={savedFilters.length >= 10}
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/30 px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  Save Current Filter
                </button>
                {savedFilters.length >= 10 && (
                  <span className="text-xs text-error">Maximum of 10 saved filters reached.</span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
