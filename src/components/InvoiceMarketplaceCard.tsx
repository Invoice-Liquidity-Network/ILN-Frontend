"use client";

import Link from "next/link";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import type { Invoice, PayerScoreResult } from "@/utils/soroban";
import { calculateYield, formatAddress, formatDate, formatTokenAmount } from "@/utils/format";
import { effectiveYieldPercent } from "@/utils/marketplace";
import RiskBadge from "./RiskBadge";
import { scoreToRiskLevel } from "@/utils/risk";

interface InvoiceMarketplaceCardProps {
  invoice: Invoice;
  token: ApprovedToken | null;
  payerScore: PayerScoreResult | null;
  isWalletConnected: boolean;
}

function timeRemaining(dueDate: bigint) {
  const diffMs = Number(dueDate) * 1000 - Date.now();
  if (diffMs <= 0) return "Due now";
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${Math.max(1, hours)}h remaining`;
}

export default function InvoiceMarketplaceCard({
  invoice,
  token,
  payerScore,
  isWalletConnected,
}: InvoiceMarketplaceCardProps) {
  const tokenMeta = token ?? { symbol: "USDC", decimals: 7 };
  const discountRate = effectiveYieldPercent(invoice);
  const yieldAmount = calculateYield(invoice.amount, invoice.discount_rate);
  const risk = scoreToRiskLevel(payerScore?.score);
  const reputationLabel = payerScore ? `${payerScore.score}/100` : "No score";

  return (
    <article className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Invoice #{invoice.id.toString()}</p>
          <h2 className="mt-2 text-2xl font-bold text-on-surface">{formatTokenAmount(invoice.amount, tokenMeta)}</h2>
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-right">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Yield</p>
          <p className="text-lg font-bold text-primary">{discountRate.toFixed(2)}%</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Token</dt>
          <dd className="mt-1 font-semibold text-on-surface">{tokenMeta.symbol}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Discount Rate</dt>
          <dd className="mt-1 font-semibold text-on-surface">{discountRate.toFixed(2)}%</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Effective Yield</dt>
          <dd className="mt-1 font-semibold text-green-600">{formatTokenAmount(yieldAmount, tokenMeta)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Due Date</dt>
          <dd className="mt-1 font-semibold text-on-surface">{formatDate(invoice.due_date)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Time Remaining</dt>
          <dd className="mt-1 font-semibold text-on-surface">{timeRemaining(invoice.due_date)}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-3 border-t border-outline-variant/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Submitter</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-on-surface-variant">{formatAddress(invoice.freelancer)}</span>
            <span className="text-xs font-semibold text-on-surface-variant">Reputation {reputationLabel}</span>
            <RiskBadge risk={risk} score={payerScore} />
          </div>
        </div>
        {isWalletConnected && (
          <Link
            href={`/pay/${invoice.id.toString()}`}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            Fund Invoice
          </Link>
        )}
      </div>
    </article>
  );
}
