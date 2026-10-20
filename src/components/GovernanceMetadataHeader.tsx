'use client';

import React from 'react';
import {
  type GovernanceMetadata,
  type GovernanceReadFailureState,
  formatGovernanceLedgerLabel,
  formatGovernanceFreshnessAge,
} from '@/utils/governanceFreshness';

interface GovernanceMetadataHeaderProps {
  metadata?: GovernanceMetadata;
  failureState?: GovernanceReadFailureState;
  className?: string;
}

export default function GovernanceMetadataHeader({
  metadata,
  failureState,
  className = '',
}: GovernanceMetadataHeaderProps) {
  if (failureState?.hasError) {
    return (
      <div
        className={`p-3 rounded-lg border border-rose-200 bg-rose-50/60 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 text-xs flex items-center justify-between ${className}`}
        data-testid="governance-read-failure-banner"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">⚠️ Governance Read Unavailable:</span>
          <span>{failureState.errorMessage ?? 'RPC node unreachable'}</span>
        </div>
        {failureState.lastKnownLedger && (
          <span className="text-[11px] opacity-80">
            Last seen Ledger #{failureState.lastKnownLedger}
          </span>
        )}
      </div>
    );
  }

  if (!metadata) return null;

  return (
    <div
      className={`flex items-center gap-3 text-xs text-on-surface-variant/80 py-1 ${className}`}
      data-testid="governance-metadata-header"
    >
      <div className="flex items-center gap-1.5 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="font-semibold text-on-surface">
          {formatGovernanceLedgerLabel(metadata)}
        </span>
      </div>
      <span>•</span>
      <span>Synced {formatGovernanceFreshnessAge(metadata.timestamp)}</span>
      <span>•</span>
      <span className="capitalize">{metadata.source.replace('-', ' ')}</span>
      {metadata.isStale && (
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Stale
        </span>
      )}
    </div>
  );
}
