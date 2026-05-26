"use client";

import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import type { LPPortfolioStats } from "@/utils/soroban";
import { formatTokenAmount } from "@/utils/format";

interface LPStatsCardsProps {
  stats: LPPortfolioStats | null;
  tokenMap: Map<string, ApprovedToken>;
  defaultToken: ApprovedToken | null;
  isLoading: boolean;
}

function SkeletonValue() {
  return <span className="mt-3 block h-8 w-28 rounded bg-surface-container-high" />;
}

function resolveToken(
  tokenId: string,
  tokenMap: Map<string, ApprovedToken>,
  defaultToken: ApprovedToken | null,
) {
  return tokenMap.get(tokenId) ?? defaultToken ?? { symbol: "USDC", decimals: 7 };
}

export default function LPStatsCards({ stats, tokenMap, defaultToken, isLoading }: LPStatsCardsProps) {
  const deployed = stats?.total_deployed_by_token ?? [];
  const totalEarned = stats?.total_earned ?? 0n;
  const activePositions = stats?.active_positions_count ?? 0;
  const averageYield = ((stats?.average_yield_bps ?? 0) / 100).toFixed(2);
  const earnedToken = resolveToken(deployed[0]?.token ?? "", tokenMap, defaultToken);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="LP portfolio summary">
      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total Deployed Capital</p>
        {isLoading ? (
          <SkeletonValue />
        ) : deployed.length > 0 ? (
          <div className="mt-3 space-y-1">
            {deployed.map((entry) => {
              const token = resolveToken(entry.token, tokenMap, defaultToken);
              return (
                <p key={entry.token} className="text-xl font-bold text-on-surface">
                  {formatTokenAmount(entry.amount, token)}
                </p>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-2xl font-bold text-on-surface">0</p>
        )}
      </div>

      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total Earned</p>
        {isLoading ? (
          <SkeletonValue />
        ) : (
          <p className="mt-3 text-2xl font-bold text-green-600">{formatTokenAmount(totalEarned, earnedToken)}</p>
        )}
      </div>

      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Active Positions</p>
        {isLoading ? <SkeletonValue /> : <p className="mt-3 text-2xl font-bold text-on-surface">{activePositions}</p>}
      </div>

      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Average Yield %</p>
        {isLoading ? <SkeletonValue /> : <p className="mt-3 text-2xl font-bold text-primary">{averageYield}%</p>}
      </div>
    </section>
  );
}
