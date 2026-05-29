"use client";

import React, { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import type { DailyVolumeBucket } from "@/utils/contract-stats";
import { TOKEN_COLORS } from "@/utils/contract-stats";

type Range = "30D" | "90D";

const CHART_TICK_STYLE = {
  fill: "var(--color-on-surface-variant, #94a3b8)",
  fontSize: 11,
  fontFamily: "inherit",
};
const GRID_STROKE = "var(--color-outline-variant, #334155)";

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, e) => sum + (e.value as number), 0);
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 shadow-xl">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-medium text-on-surface">{entry.name}</span>
            </div>
            <span className="text-xs font-bold text-on-surface">
              {Number(entry.value).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
        <div className="my-1 h-px bg-outline-variant/10" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-on-surface">Total USD</span>
          <span className="text-xs font-extrabold text-primary">
            ${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  dailyVolume: DailyVolumeBucket[];
}

export default function StatsVolumeChart({ dailyVolume }: Props) {
  const [range, setRange] = useState<Range>("30D");

  const data = useMemo(() => {
    const days = range === "30D" ? 30 : 90;
    return dailyVolume.slice(-days);
  }, [dailyVolume, range]);

  const isEmpty = data.length === 0 || data.every((d) => d.volume_usd === 0);

  return (
    <div className="flex flex-col gap-6 rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface">Historical Volume</h3>
          <p className="text-sm text-on-surface-variant">Daily funded volume across all tokens</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl self-start">
          {(["30D", "90D"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                range === r
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[180px] w-full md:h-[240px]">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 border-2 border-dashed border-outline-variant/20 rounded-2xl">
            <span className="material-symbols-outlined text-outline-variant/40 text-4xl">
              bar_chart
            </span>
            <p className="text-sm font-medium text-on-surface-variant">
              No volume data in this period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {Object.entries(TOKEN_COLORS).map(([symbol, color]) => (
                  <linearGradient key={`grad-${symbol}`} id={`vol-grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={GRID_STROKE}
                strokeOpacity={0.2}
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
                tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="usdc"
                name="USDC"
                stackId="1"
                stroke={TOKEN_COLORS.USDC}
                fill="url(#vol-grad-USDC)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="eurc"
                name="EURC"
                stackId="1"
                stroke={TOKEN_COLORS.EURC}
                fill="url(#vol-grad-EURC)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="xlm"
                name="XLM"
                stackId="1"
                stroke={TOKEN_COLORS.XLM}
                fill="url(#vol-grad-XLM)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
