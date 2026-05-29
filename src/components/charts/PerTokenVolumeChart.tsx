"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import type { Invoice, ProtocolContractStats } from "@/utils/soroban";
import {
  buildPerTokenVolumeData,
  type TokenSymbol,
  type TokenVolumeRange,
} from "@/utils/per-token-volume";

const TOKEN_COLORS: Record<TokenSymbol, string> = {
  USDC: "#2563eb",
  EURC: "#f59e0b",
  XLM: "#111827",
};

const RANGES: TokenVolumeRange[] = [30, 90];

const CHART_TICK_STYLE = {
  fill: "var(--color-on-surface-variant, #64748b)",
  fontSize: 11,
  fontFamily: "inherit",
};

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function TokenTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, entry) => sum + Number(entry.value ?? 0), 0);

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 shadow-xl">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        Week of {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-on-surface">{entry.name}</span>
            </div>
            <span className="text-xs font-bold text-on-surface">
              {formatUsd(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
        <div className="my-1 h-px bg-outline-variant/10" />
        <div className="flex items-center justify-between gap-5">
          <span className="text-xs font-bold text-on-surface">Token total</span>
          <span className="text-xs font-extrabold text-primary">{formatUsd(total)}</span>
        </div>
      </div>
    </div>
  );
}

export default function PerTokenVolumeChart({
  stats,
  invoices,
}: {
  stats?: ProtocolContractStats | null;
  invoices: Invoice[];
}) {
  const [range, setRange] = useState<TokenVolumeRange>(30);
  const { buckets, summary } = useMemo(
    () => buildPerTokenVolumeData({ stats, invoices, rangeDays: range }),
    [invoices, range, stats],
  );

  return (
    <div className="flex flex-col gap-6 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface">
            Volume by Token
          </h3>
          <p className="text-sm text-on-surface-variant">
            Weekly protocol volume stacked by supported token.
          </p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-xl bg-surface-container p-1">
          {RANGES.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                range === days
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            USD-equivalent
          </p>
          <p className="mt-1 font-headline text-2xl font-bold text-on-surface">
            {formatUsd(summary.totalUsd)}
          </p>
        </div>
        {(["USDC", "EURC", "XLM"] as TokenSymbol[]).map((symbol) => (
          <div
            key={symbol}
            className="rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: TOKEN_COLORS[symbol] }}
                aria-hidden="true"
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                {symbol}
              </p>
            </div>
            <p className="mt-1 font-headline text-xl font-bold text-on-surface">
              {formatUsd(summary.totals[symbol])}
            </p>
          </div>
        ))}
      </div>

      <div className="h-[260px] w-full">
        {buckets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-outline-variant/40" aria-hidden="true">
              stacked_bar_chart
            </span>
            <p className="text-sm font-medium text-on-surface-variant">
              No token volume in this period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid
                stroke="var(--color-outline-variant, #334155)"
                strokeDasharray="3 3"
                strokeOpacity={0.2}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={CHART_TICK_STYLE}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={CHART_TICK_STYLE}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatUsd(value)}
              />
              <Tooltip content={<TokenTooltip />} />
              <Bar dataKey="USDC" stackId="volume" fill={TOKEN_COLORS.USDC} radius={[6, 6, 0, 0]} />
              <Bar dataKey="EURC" stackId="volume" fill={TOKEN_COLORS.EURC} radius={[6, 6, 0, 0]} />
              <Bar dataKey="XLM" stackId="volume" fill={TOKEN_COLORS.XLM} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
