"use client";

import React from "react";
import MetricCard from "@/components/analytics/MetricCard";
import type { ContractStats } from "@/utils/contract-stats";

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

interface Props {
  stats: ContractStats;
}

export default function StatsMetricCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        id="stat-total-invoices"
        icon="receipt_long"
        label="Total Invoices"
        value={stats.total_invoices.toLocaleString()}
        sub="All invoices on-chain"
        accent={false}
      />
      <MetricCard
        id="stat-total-funded"
        icon="account_balance"
        label="Total Funded"
        value={stats.total_funded.toLocaleString()}
        sub="Invoices funded by LPs"
        accent={false}
      />
      <MetricCard
        id="stat-total-paid"
        icon="check_circle"
        label="Total Paid"
        value={stats.total_paid.toLocaleString()}
        sub="Successfully settled"
        accent={false}
      />
      <MetricCard
        id="stat-total-volume"
        icon="paid"
        label="Total Volume"
        value={formatUsd(stats.total_volume_usd)}
        sub="USD-equivalent funded"
        accent={true}
      />
      <MetricCard
        id="stat-protocol-fees"
        icon="savings"
        label="Protocol Fees Collected"
        value={formatUsd(stats.total_protocol_fees_usd ?? 0)}
        sub="Fees collected by protocol"
        accent={false}
        tooltip="This fee funds ILN protocol development and the treasury"
        badge={
          stats.feeRateBps === 0 ? (
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
              0% FEE
            </span>
          ) : null
        }
      />
    </div>
  );
}
