"use client";

import AnimatedNumber from "@/components/AnimatedNumber";
import { useInvoiceCount } from "@/hooks/queries/useInvoiceCount";
import { useContractStats } from "@/hooks/useContractStats";

/**
 * Static fallback shown when the contract query fails, so the hero never
 * renders an empty or broken ticker. Kept deliberately modest.
 */
const FALLBACK_COUNT = 0;

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * Live, animated invoice counter for the homepage hero (#133).
 *
 * - Polls `get_invoice_count` every 30s (via {@link useInvoiceCount}).
 * - Smoothly animates the number on each update with {@link AnimatedNumber}.
 * - Shows total funded volume (USD-equivalent) alongside the count.
 * - Falls back to a static number if the contract query fails, rather than
 *   hiding or crashing the hero.
 */
export default function LiveInvoiceTicker() {
  const { data: count, isError: countError } = useInvoiceCount();
  const { data: stats } = useContractStats();

  const displayCount = countError || count === undefined ? FALLBACK_COUNT : count;
  const volumeUsd = stats?.total_volume_usd ?? 0;

  return (
    <div
      className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-10"
      aria-live="polite"
      data-testid="live-invoice-ticker"
    >
      <div className="flex items-baseline gap-2">
        <AnimatedNumber
          value={displayCount}
          className="text-3xl lg:text-4xl font-bold text-on-primary-container font-headline tabular-nums"
          formatter={(v) => Math.round(v).toLocaleString()}
        />
        <span className="text-sm text-on-primary-container/70 font-body">
          invoices financed and counting
        </span>
      </div>

      {volumeUsd > 0 && (
        <div className="flex items-baseline gap-2">
          <span className="text-3xl lg:text-4xl font-bold text-on-primary-container font-headline tabular-nums">
            {formatUsd(volumeUsd)}
          </span>
          <span className="text-sm text-on-primary-container/70 font-body">
            total funded volume
          </span>
        </div>
      )}
    </div>
  );
}
