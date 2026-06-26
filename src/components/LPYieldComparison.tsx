"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Invoice } from "@/utils/soroban";
import { fetchThreeMonthTBillRatePct } from "@/lib/treasury-rates";
import {
  buildTokenYieldComparison,
  formatPremiumBps,
} from "@/utils/lp-yield-comparison";
import { buildYieldTimeSeries } from "@/utils/yield-timeseries";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useBalances } from "@/hooks/useBalances";
import { RiskLevel } from "@/utils/risk";
import { formatTokenAmount } from "@/utils/format";

interface LPYieldComparisonProps {
  invoices: Invoice[];
  lpAddress: string;
  isLoading?: boolean;
}

const TOKENS = ["USDC", "EURC", "XLM"] as const;
type ComparisonToken = (typeof TOKENS)[number];

function getTokenRiskProfile(symbol: string): RiskLevel {
  switch (symbol.toUpperCase()) {
    case "USDC":
      return "Low";
    case "EURC":
      return "Low";
    case "XLM":
      return "Medium";
    default:
      return "Unknown";
  }
}

const TOKEN_COLORS: Record<string, string> = {
  USDC: "#6366f1",
  EURC: "#06b6d4",
  XLM: "#8b5cf6",
};

function AssetRiskBadge({ risk }: { risk: RiskLevel }) {
  const BADGE_STYLES: Record<RiskLevel, { pill: string; dot: string }> = {
    Low: { pill: "bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400", dot: "bg-green-500" },
    Medium: { pill: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30 dark:text-yellow-400", dot: "bg-yellow-500" },
    High: { pill: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400", dot: "bg-red-500" },
    Unknown: { pill: "bg-gray-400/10 text-gray-500 border-gray-400/30 dark:text-gray-400", dot: "bg-gray-400" },
  };

  const { pill, dot } = BADGE_STYLES[risk];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {risk}
    </div>
  );
}

export default function LPYieldComparison({
  invoices,
  lpAddress,
  isLoading = false,
}: LPYieldComparisonProps) {
  const [tBillYieldPct, setTBillYieldPct] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<ComparisonToken>("USDC");

  const { tokens, isLoading: tokensLoading } = useApprovedTokens();
  const { balances, isLoading: balancesLoading } = useBalances(tokens);

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

  const selectedRow = rows.find((r) => r.symbol === selectedToken);

  const timeseries = useMemo(() => {
    return buildYieldTimeSeries(invoices, lpAddress, 90);
  }, [invoices, lpAddress]);

  const chartData = useMemo(() => {
    return timeseries.map((d) => ({
      date: d.date,
      yield: d[selectedToken] ?? 0,
    }));
  }, [timeseries, selectedToken]);

  // Compute available liquidity for the selected token
  const selectedTokenMetadata = tokens.find(
    (t) => t.symbol.toUpperCase() === selectedToken
  );
  
  const rawBalance = selectedTokenMetadata 
    ? balances.get(selectedTokenMetadata.contractId) ?? 0n 
    : 0n;
    
  const formattedLiquidity = selectedTokenMetadata
    ? formatTokenAmount(rawBalance, selectedTokenMetadata)
    : "0.00";

  const isFullyLoading = isLoading || tBillYieldPct === null;

  if (isFullyLoading) {
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-surface-dim pb-4">
        <div>
          <h2
            id="yield-comparison-heading"
            className="text-lg font-semibold text-on-surface"
          >
            Yield Analytics
          </h2>
          <p className="text-sm text-on-surface-variant">
            Compare performance across supported assets
          </p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-xl">
          {TOKENS.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedToken(sym)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedToken === sym
                  ? "bg-primary text-surface-container-lowest shadow-md"
                  : "text-on-surface-variant hover:bg-surface-variant/30"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Your Avg {selectedToken} Yield
          </p>
          <p className="text-2xl font-bold text-on-surface">
            {selectedRow?.lpYieldPct.toFixed(2)}%
          </p>
          <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
            {formatPremiumBps(selectedRow?.premiumBps ?? 0)}
          </p>
        </div>

        <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Available Liquidity
          </p>
          <p className="flex items-baseline gap-1 text-2xl font-bold text-on-surface">
            {tokensLoading || balancesLoading ? "..." : formattedLiquidity}
            <span className="text-sm font-normal text-on-surface-variant">{selectedToken}</span>
          </p>
          <p className="mt-1 text-xs font-medium text-on-surface-variant">
            In your wallet
          </p>
        </div>

        <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Asset Risk Profile
          </p>
          <div className="mt-1">
            <AssetRiskBadge risk={getTokenRiskProfile(selectedToken)} />
          </div>
          <p className="mt-2 text-xs font-medium text-on-surface-variant">
            Based on volatility & contract risk
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-bold text-on-surface">Historical Yield (90 Days)</h3>
        {chartData.every((d) => d.yield === 0) ? (
          <p className="py-10 text-center text-sm text-on-surface-variant">
            No historical yield data available for {selectedToken}.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-outline-variant)"
                  opacity={0.15}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }}
                  width={48}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface-container)",
                    border: "1px solid var(--color-outline-variant)",
                    borderRadius: "0.75rem",
                  }}
                  formatter={(value: number) => [`${value.toFixed(4)} ${selectedToken}`, "Yield"]}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  stroke={TOKEN_COLORS[selectedToken]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: TOKEN_COLORS[selectedToken], strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-on-surface-variant">
        T-bill rates ({tBillYieldPct?.toFixed(2)}%) are fetched from U.S. Treasury public data for illustration only and
        do not represent investment advice. On-chain invoice yields carry additional
        smart-contract and counterparty risk.
      </p>
    </section>
  );
}

