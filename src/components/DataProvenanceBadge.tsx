'use client';

import React from 'react';
import { type DataMetricKey } from '@/lib/data-ownership';
import { getMetricProvenance, type ProvenanceTier } from '@/lib/data-provenance';

interface DataProvenanceBadgeProps {
  metric: DataMetricKey;
  isCached?: boolean;
  isDevMock?: boolean;
  className?: string;
}

export default function DataProvenanceBadge({
  metric,
  isCached = false,
  isDevMock = false,
  className = '',
}: DataProvenanceBadgeProps) {
  const details = getMetricProvenance(metric, isCached, isDevMock);
  const { badgeStyle, label, source, freshness, description } = details;

  const tooltip = `Provenance: ${label} • Source: ${source} • Freshness: ${freshness} (${description})`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} ${className}`}
      title={tooltip}
      aria-label={tooltip}
      data-testid="data-provenance-badge"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
      {label}
    </span>
  );
}
