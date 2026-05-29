"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Invoice } from "@/utils/soroban";
import { fetchThreeMonthTBillRatePct } from "@/lib/treasury-rates";
import {
  buildTokenYieldComparison,
  formatPremiumBps,
} from "@/utils/lp-yield-comparison";

interface LPYieldComparisonProps {
  invoices: Invoice[];
  lpAddress: string;
  isLoading?: boolean;
}

export default function LPYieldComparison({
  invoices,
  lpAddress,
  isLoading = false,
}: LPYieldComparisonProps) {
  const [tBillYieldPct, setTBillYieldPct] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchThreeMonthTBillRatePct().then((rate) => {
      if (!cancelled) setTBillYieldPct(rate);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    if (tBillYieldPct === null) return [];
    return buildTokenYieldComparison(invoices, lpAddress, tBillYieldPct);
  }, [invoices, lpAddress, tBillYieldPct]);

  const chartData = rows.map((row) => ({
    token: row.symbol,
    "Your yield": Number(row.lpYieldPct.toFixed(2)),
    "Protocol avg": Number(row.protocolYieldPct.toFixed(2)),
    "3-mo T-bill": Number(row.tBillYieldPct.toFixed(2)),
  }));

  const avgPremiumBps =
    rows.length > 0
      ? Math.round(rows.reduce((sum, row) => sum + row.premiumBps, 0) / rows.length)
      : 0;

  if (isLoading || tBillYieldPct === null) {
    return (
      <div className="animate-pulse rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6">
        <div className="h-5 w-40 rounded bg-surface-variant mb-4" />
        <div className="h-64 rounded-xl bg-surface-variant" />
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6"
      aria-labelledby="yield-comparison-heading"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="yield-comparison-heading"
            className="text-lg font-semibold text-on-surface"
          >
            Yield Comparison
          </h2>
          <p className="text-sm text-on-surface-variant">
            Your average annualized yield vs protocol average and the 3-month T-bill
            ({tBillYieldPct.toFixed(2)}%).
          </p>
        </div>
        <p className="text-sm font-semibold text-primary">
          {formatPremiumBps(avgPremiumBps)}
        </p>
      </div>

      {chartData.every(
        (d) => d["Your yield"] === 0 && d["Protocol avg"] === 0,
      ) ? (
        <p className="py-10 text-center text-sm text-on-surface-variant">
          Fund and settle invoices to see yield comparisons.
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-outline-variant)"
                opacity={0.15}
              />
              <XAxis
                dataKey="token"
                tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
              />
              <YAxis
                tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }}
                width={48}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-outline-variant)",
                  borderRadius: "0.75rem",
                }}
                formatter={(value: number) => `${value.toFixed(2)}%`}
              />
              <Legend />
              <Bar dataKey="Your yield" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Protocol avg" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="3-mo T-bill" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-4 text-xs text-on-surface-variant leading-relaxed">
        T-bill rates are fetched from U.S. Treasury public data for illustration only and
        do not represent investment advice. On-chain invoice yields carry additional
        smart-contract and counterparty risk.
      </p>
    </section>
  );
}
