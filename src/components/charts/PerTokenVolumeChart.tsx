"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getContractStats } from "@/utils/soroban";
import {
  transformPerTokenVolumeStats,
  type PerTokenVolumeBucket,
  type VolumeTimeRange,
} from "@/utils/perTokenVolume";

const TIME_RANGES: VolumeTimeRange[] = ["30D", "90D"];
const TOKEN_COLORS = {
  USDC: "#2563eb",
  EURC: "#eab308",
  XLM: "#111827",
} as const;

const CHART_TICK_STYLE = {
  fill: "var(--color-on-surface-variant, #64748b)",
  fontSize: 11,
  fontFamily: "inherit",
};

const GRID_STROKE = "var(--color-outline-variant, #cbd5e1)";

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function TokenVolumeTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as PerTokenVolumeBucket;

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 shadow-xl">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        Week of {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs font-medium text-on-surface">{entry.name}</span>
            </div>
            <span className="text-xs font-bold text-on-surface">
              {formatUsd(Number(entry.value))}
            </span>
          </div>
        ))}
        <div className="my-1 h-px bg-outline-variant/10" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-on-surface">USD-equivalent</span>
          <span className="text-xs font-extrabold text-primary">{formatUsd(row.totalUsd)}</span>
        </div>
      </div>
    </div>
  );
}

export default function PerTokenVolumeChart() {
  const [range, setRange] = useState<VolumeTimeRange>("30D");
  const [rawStats, setRawStats] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      setError("");
      try {
        const stats = await getContractStats();
        if (!cancelled) setRawStats(stats);
      } catch (err) {
        if (!cancelled) {
          setRawStats(null);
          setError(err instanceof Error ? err.message : "Unable to load contract stats.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const { buckets, summary } = useMemo(
    () => transformPerTokenVolumeStats(rawStats, range),
    [rawStats, range],
  );
  const isEmpty = !loading && buckets.length === 0;

  return (
    <div className="flex flex-col gap-6 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface">
            Per-token Volume
          </h3>
          <p className="text-sm text-on-surface-variant">
            Weekly funded volume by supported token from contract stats
          </p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-xl bg-surface-container p-1">
          {TIME_RANGES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                range === option
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              aria-pressed={range === option}
            >
              {option.replace("D", " days")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-surface-container-low p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
            Total USD-equiv
          </p>
          <p className="mt-1 font-headline text-2xl font-bold text-on-surface">
            {formatUsd(summary.totalUsd)}
          </p>
        </div>
        {(["USDC", "EURC", "XLM"] as const).map((token) => (
          <div key={token} className="rounded-2xl bg-surface-container-low p-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: TOKEN_COLORS[token] }}
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                {token}
              </p>
            </div>
            <p className="mt-1 font-headline text-2xl font-bold text-on-surface">
              {formatUsd(summary[token])}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          Contract stats unavailable: {error}
        </div>
      )}

      <div className="relative h-[220px] w-full md:h-[280px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-container-lowest/50 backdrop-blur-[1px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-outline-variant/30 border-t-primary" />
          </div>
        )}

        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-outline-variant/40">
              bar_chart
            </span>
            <p className="text-sm font-medium text-on-surface-variant">
              No per-token volume data for this period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={GRID_STROKE}
                strokeOpacity={0.35}
              />
              <XAxis dataKey="label" tick={CHART_TICK_STYLE} tickLine={false} axisLine={false} />
              <YAxis
                tick={CHART_TICK_STYLE}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatUsd(value).replace("$", "")}
              />
              <Tooltip content={<TokenVolumeTooltip />} />
              <Bar dataKey="USDC" stackId="volume" fill={TOKEN_COLORS.USDC} radius={[4, 4, 0, 0]} />
              <Bar dataKey="EURC" stackId="volume" fill={TOKEN_COLORS.EURC} radius={[4, 4, 0, 0]} />
              <Bar dataKey="XLM" stackId="volume" fill={TOKEN_COLORS.XLM} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
