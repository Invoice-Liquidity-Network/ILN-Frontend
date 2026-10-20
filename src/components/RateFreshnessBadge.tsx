'use client';

import React from 'react';
import { evaluateRateFreshness, type RateFreshnessOptions } from '@/utils/rateFreshness';

interface RateFreshnessBadgeProps {
  timestamp: number | string | Date;
  options?: RateFreshnessOptions;
  className?: string;
}

export default function RateFreshnessBadge({
  timestamp,
  options,
  className = '',
}: RateFreshnessBadgeProps) {
  const { isStale, statusText, badgeTone } = evaluateRateFreshness(timestamp, options);

  const colors = {
    fresh: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    stale: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    expired: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  }[badgeTone];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors} ${className}`}
      title={isStale ? 'Rate may not reflect current market conditions' : 'Live authoritative rate'}
      data-testid="rate-freshness-badge"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isStale ? 'bg-amber-500' : 'bg-emerald-500'}`}
      />
      {statusText}
    </span>
  );
}
