"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { formatTokenAmount, formatUSD } from "@/utils/format";
import {
  calculateTokenAllocations,
  TokenYieldMetrics,
} from "@/utils/per-token-yield";

const CHART_COLORS = ["#0ea5e9", "#f97316", "#14b8a6", "#8b5cf6", "#f59e0b"];

interface LPPortfolioAllocationChartProps {
  metrics: TokenYieldMetrics[];
}

export default function LPPortfolioAllocationChart({ metrics }: LPPortfolioAllocationChartProps) {
  const allocation = useMemo(() => calculateTokenAllocations(metrics), [metrics]);

  if (allocation.length === 0) {
    return null;
  }

  const totalUsd = allocation.reduce((sum, slice) => sum + slice.usdEquivalent, 0n);

  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Portfolio allocation</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Capital deployed by token with USD equivalent totals.
          </p>
        </div>
        <div className="rounded-2xl bg-surface-container p-4 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">
            Total deployed
          </p>
          <p className="mt-1 text-2xl font-bold text-on-surface">
            {formatUSD(totalUsd, 7)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                dataKey="usdAmount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
                labelLine={false}
                label={false}
              >
                {allocation.map((slice, index) => (
                  <Cell
                    key={slice.token.contractId}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Allocation"]}
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {allocation.map((slice, index) => (
            <div
              key={slice.token.contractId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <div>
                  <p className="font-semibold text-on-surface">{slice.token.symbol}</p>
                  <p className="text-sm text-on-surface-variant">
                    {formatTokenAmount(slice.totalFunded, {
                      symbol: slice.token.symbol,
                      decimals: slice.token.decimals,
                    })}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-on-surface">
                {slice.percentage.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
