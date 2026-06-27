"use client";

import React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from "recharts";
import FieldTooltip from "@/components/FieldTooltip";
import type { DisputeRateMetrics } from "@/utils/dispute-rate";
import {
  DISPUTE_RATE_TOOLTIP,
  formatDisputeRatePercent,
  getDisputeRateColor,
  getDisputeRateColorClasses,
} from "@/utils/dispute-rate";

function SparklineTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as { label: string; ratePercent: number } | undefined;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-on-surface">{point.label}</p>
      <p className="text-on-surface-variant">{formatDisputeRatePercent(point.ratePercent)}</p>
    </div>
  );
}

interface Props {
  metrics: DisputeRateMetrics;
}

export default function StatsDisputeRateCard({ metrics }: Props) {
  const color = getDisputeRateColor(metrics.rate30dPercent);
  const colors = getDisputeRateColorClasses(color);
  const hasTrend = metrics.dailyTrend90d.some((d) => d.fundedCount > 0 || d.disputedCount > 0);

  return (
    <div
      id="stat-dispute-rate"
      className={`flex flex-col gap-4 rounded-[24px] border bg-surface-container-lowest p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between ${colors.border}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Dispute Rate
          </span>
          <FieldTooltip content={DISPUTE_RATE_TOOLTIP} />
        </div>
        <p className={`font-headline text-3xl font-bold ${colors.value}`}>
          {formatDisputeRatePercent(metrics.rate30dPercent)}
        </p>
        <p className="text-xs text-on-surface-variant">Last 30 days</p>
        <p className="text-xs text-on-surface-variant/80">
          {metrics.disputed30d.toLocaleString()} disputed / {metrics.funded30d.toLocaleString()}{" "}
          funded
        </p>
      </div>

      <div className="h-20 w-full sm:h-16 sm:w-56" aria-label="Dispute rate trend over 90 days">
        {hasTrend ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.dailyTrend90d} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <Tooltip content={<SparklineTooltip />} />
              <Line
                type="monotone"
                dataKey="ratePercent"
                stroke={colors.sparkline}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-outline-variant/20 text-xs text-on-surface-variant">
            No funded events in 90 days
          </div>
        )}
      </div>
    </div>
  );
}
