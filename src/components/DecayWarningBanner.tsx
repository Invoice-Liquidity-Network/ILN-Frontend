'use client';

import { useEffect, useState } from 'react';
import { useReputationDecay } from '@/hooks/useReputationDecay';
import { useWallet } from '@/context/WalletContext';

/** localStorage key holding the timestamp when the user dismissed the decay warning. */
const STORAGE_KEY = 'iln:dismissed-decay-warning';

function readDismissedTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

/** Show the banner again if it's been more than 7 days since dismissal. */
const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function DecayWarningBanner({ address }: { address?: string }) {
  const { address: connectedAddress } = useWallet();
  const targetAddress = address || connectedAddress;
  const { isDecaying, projectedScore30Days, currentScore, loading } = useReputationDecay(
    targetAddress || undefined
  );
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted dismissal after mount to avoid SSR/client hydration mismatch.
  useEffect(() => {
    setDismissedAt(readDismissedTimestamp());
    setHydrated(true);
  }, []);

  const dismiss = () => {
    const now = Date.now();
    setDismissedAt(now);
    try {
      window.localStorage.setItem(STORAGE_KEY, now.toString());
    } catch {
      // Storage may be unavailable (private mode / quota) — dismissal still
      // applies for this session via state.
    }
  };

  // Only show on the connected wallet's own profile/dashboard
  if (!connectedAddress || connectedAddress.toLowerCase() !== targetAddress?.toLowerCase()) {
    return null;
  }

  if (loading || !isDecaying) {
    return null;
  }

  // Don't show if dismissed within the last 7 days
  if (hydrated && dismissedAt && Date.now() - dismissedAt < DISMISSAL_DURATION_MS) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 shadow-sm flex items-start gap-3">
      <span
        className="material-symbols-outlined mt-0.5"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        warning
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm">
          Your reputation is decaying due to inactivity. Make or receive a payment to halt decay.
        </h3>
        <p className="mt-1 text-xs opacity-90">
          Current score: {currentScore.toFixed(0)} • Projected score in 30 days:{' '}
          {projectedScore30Days.toFixed(0)}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss decay warning"
        className="shrink-0 rounded-lg p-1 transition-colors hover:bg-amber-500/15"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">
          close
        </span>
      </button>
    </div>
  );
}
