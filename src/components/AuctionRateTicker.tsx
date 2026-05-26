"use client";

import { useEffect, useMemo, useState } from "react";
import type { Invoice } from "@/utils/soroban";
import {
  calculateDutchAuctionState,
  formatAuctionCountdown,
  getDutchAuctionTerms,
} from "@/utils/dutchAuction";

export default function AuctionRateTicker({ invoice }: { invoice: Invoice }) {
  const terms = useMemo(() => getDutchAuctionTerms(invoice), [invoice]);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!terms) return;
    const interval = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [terms]);

  if (!terms) {
    return (
      <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded text-xs font-bold">
        {(invoice.discount_rate / 100).toFixed(2)}%
      </span>
    );
  }

  const state = calculateDutchAuctionState(terms, nowSeconds);
  const endTime = new Date(terms.endsAt * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-w-[180px] max-w-[240px]" aria-label="Dutch auction rate">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 shadow-sm">
        <div className="text-xs font-bold">
          Current Rate: {state.currentRateBps} bps
        </div>
        <div className="mt-0.5 text-[11px] leading-4">
          decreasing to {state.minRateBps} bps by {endTime}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-amber-200" aria-hidden="true">
          <div
            className="h-full rounded-full bg-amber-600 transition-all duration-500"
            style={{ width: `${state.progressPercent}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] font-semibold">
          {state.isComplete
            ? "Minimum rate reached"
            : `Act now - rate decreases in ${formatAuctionCountdown(state.secondsUntilNextDecrease)}`}
        </div>
      </div>
    </div>
  );
}
