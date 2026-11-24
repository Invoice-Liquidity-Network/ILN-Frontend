'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useReputation } from '@/hooks/queries';
import type { ReputationScore } from '@/utils/soroban';
import Skeleton from '@/components/ui/Skeleton';

/**
 * Minimum number of settled (paid or defaulted) invoices required before
 * styling or labeling a payer's reputation score as trusted/moderate/low.
 */
export const MIN_SETTLED_REPUTATION_HISTORY = 1;

export type ReputationTier = 'insufficient' | 'unavailable' | 'trusted' | 'moderate' | 'low';

export interface PayerReputationAssessment {
  /** Clamped 0-100 score when history is sufficient; null when insufficient or unavailable. */
  displayScore: number | null;
  /** Ring fill percentage (0-100); 0 when insufficient/unavailable so neutral state is never styled as trusted. */
  ringScore: number;
  paid: number;
  defaulted: number;
  submitted: number;
  settledCount: number;
  hasSufficientHistory: boolean;
  tier: ReputationTier;
  tierLabel: string;
  ringColorClass: string;
  badgeClass: string;
}

function toNonNegativeInt(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Classifies on-chain payer reputation (`get_reputation` Soroban contract read).
 *
 * Assumptions & authorization:
 * - Reputation data is public, read-only on-chain state fetched via `useReputation(address)`.
 * - No wallet signature or privileged role is required to view a payer's reputation.
 *
 * Failure & insufficient-history behavior:
 * - When `isError` is true and no cached reputation is available, returns `unavailable` with neutral styling.
 * - When `reputation` is `null`/`undefined` or `invoices_paid + invoices_defaulted < MIN_SETTLED_REPUTATION_HISTORY`,
 *   returns `insufficient` with neutral styling (`ringScore = 0`, `displayScore = null`) so an unverified or
 *   baseline score is never styled or described as trusted/excellent or defaulted.
 *
 * Residual risk:
 * - `getReputation` in `src/utils/soroban.ts` catches RPC errors and returns `null`, so a network failure
 *   inside `getReputation` is indistinguishable from a missing on-chain record at this layer unless
 *   `getReputation` is updated to propagate errors.
 * - `MIN_SETTLED_REPUTATION_HISTORY = 1` is a minimal floor; a single settled invoice still carries thin
 *   statistical confidence.
 */
export function assessPayerReputation(
  reputation: ReputationScore | null | undefined,
  isError = false
): PayerReputationAssessment {
  const paid = toNonNegativeInt(reputation?.invoices_paid);
  const defaulted = toNonNegativeInt(reputation?.invoices_defaulted);
  const submitted = toNonNegativeInt(reputation?.invoices_submitted);
  const settledCount = paid + defaulted;

  if (isError && !reputation) {
    return {
      displayScore: null,
      ringScore: 0,
      paid,
      defaulted,
      submitted,
      settledCount,
      hasSufficientHistory: false,
      tier: 'unavailable',
      tierLabel: 'Unavailable',
      ringColorClass: 'text-on-surface-variant/30',
      badgeClass: 'bg-surface-container text-on-surface-variant',
    };
  }

  if (!reputation || settledCount < MIN_SETTLED_REPUTATION_HISTORY) {
    return {
      displayScore: null,
      ringScore: 0,
      paid,
      defaulted,
      submitted,
      settledCount,
      hasSufficientHistory: false,
      tier: 'insufficient',
      tierLabel: 'Insufficient history',
      ringColorClass: 'text-on-surface-variant/30',
      badgeClass: 'bg-surface-container text-on-surface-variant',
    };
  }

  const rawScore =
    typeof reputation.score === 'number' && Number.isFinite(reputation.score)
      ? reputation.score
      : 0;
  const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  if (clampedScore > 80) {
    return {
      displayScore: clampedScore,
      ringScore: clampedScore,
      paid,
      defaulted,
      submitted,
      settledCount,
      hasSufficientHistory: true,
      tier: 'trusted',
      tierLabel: 'Trusted',
      ringColorClass: 'text-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    };
  }

  if (clampedScore > 50) {
    return {
      displayScore: clampedScore,
      ringScore: clampedScore,
      paid,
      defaulted,
      submitted,
      settledCount,
      hasSufficientHistory: true,
      tier: 'moderate',
      tierLabel: 'Moderate',
      ringColorClass: 'text-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    };
  }

  return {
    displayScore: clampedScore,
    ringScore: clampedScore,
    paid,
    defaulted,
    submitted,
    settledCount,
    hasSufficientHistory: true,
    tier: 'low',
    tierLabel: 'Low',
    ringColorClass: 'text-red-500',
    badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-300',
  };
}

interface PayerReputationCardProps {
  address: string;
  refreshTrigger?: number;
}

export default function PayerReputationCard({ address, refreshTrigger }: PayerReputationCardProps) {
  const { data: reputation, isLoading, isError, error, refetch } = useReputation(address);
  const [showTooltip, setShowTooltip] = useState(false);
  const prevRefreshTrigger = React.useRef(refreshTrigger);

  useEffect(() => {
    if (
      refreshTrigger !== undefined &&
      prevRefreshTrigger.current !== undefined &&
      refreshTrigger !== prevRefreshTrigger.current
    ) {
      void refetch();
    }
    prevRefreshTrigger.current = refreshTrigger;
  }, [refreshTrigger, refetch]);

  useEffect(() => {
    if (isError && error) {
      console.error('Failed to load reputation:', error);
    }
  }, [isError, error]);

  if (isLoading && !reputation) {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
        <Skeleton className="h-6 w-32" />
        <div className="mt-6 flex items-center gap-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const assessment = assessPayerReputation(reputation, isError);
  const strokeDasharray = 2 * Math.PI * 36;
  const strokeDashoffset = strokeDasharray - (assessment.ringScore / 100) * strokeDasharray;

  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-on-surface">Reputation</h2>
          <span
            data-testid="reputation-tier-badge"
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${assessment.badgeClass}`}
          >
            {assessment.tierLabel}
          </span>
          <div
            className="relative cursor-help group"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              info
            </span>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[200] w-48 rounded-lg bg-surface-container-high p-3 shadow-lg text-xs text-on-surface border border-outline-variant/20">
                Your score affects whether LPs are willing to fund your invoices
              </div>
            )}
          </div>
        </div>
        <Link
          href="/governance/how-it-works"
          className="text-sm font-bold text-primary hover:underline"
        >
          How reputation works
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        <div className="relative h-24 w-24 flex items-center justify-center shrink-0">
          <svg className="h-24 w-24 -rotate-90" aria-hidden="true">
            <circle
              cx="48"
              cy="48"
              r="36"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              className="text-outline-variant/10"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              data-testid="reputation-score-ring"
              className={`transition-all duration-1000 ${assessment.ringColorClass}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              data-testid="reputation-score-value"
              className="text-2xl font-bold text-on-surface leading-none"
            >
              {assessment.displayScore !== null ? assessment.displayScore : 'N/A'}
            </span>
            <span className="text-[10px] uppercase font-bold text-on-surface-variant mt-1">
              Score
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 flex-1 w-full">
          <div className="bg-surface-container/30 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1">
              Paid
            </p>
            <p className="text-xl font-bold text-on-surface">{assessment.paid}</p>
          </div>
          <div className="bg-surface-container/30 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1">
              Defaulted
            </p>
            <p className="text-xl font-bold text-red-600">{assessment.defaulted}</p>
          </div>
          <div className="bg-surface-container/30 rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-1">
              Submitted
            </p>
            <p className="text-xl font-bold text-on-surface">{assessment.submitted}</p>
          </div>
        </div>
      </div>

      {isError && (
        <p
          role="alert"
          data-testid="reputation-error"
          className="mt-4 rounded-xl border border-outline-variant/20 bg-surface-container/40 px-3 py-2 text-xs text-on-surface-variant"
        >
          Unable to load latest reputation data from the network.
        </p>
      )}

      {!isError && !assessment.hasSufficientHistory && (
        <p
          role="status"
          data-testid="reputation-insufficient-history"
          className="mt-4 rounded-xl border border-outline-variant/20 bg-surface-container/40 px-3 py-2 text-xs text-on-surface-variant"
        >
          Insufficient history: no settled invoices recorded yet. Score is unverified.
        </p>
      )}
    </div>
  );
}
