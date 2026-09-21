import { useEffect } from 'react';
import { NEXT_PUBLIC_ORACLE_ENABLED } from '@constants';
import { trackEvent } from '@lib/analytics';

import type { OracleState } from '@types/oracle';

interface OracleBadgeProps {
  verified: boolean;
  state?: OracleState;
}

export default function OracleBage({ verified, state }: OracleBadgeProps) {
  const isEnabled = NEXT_PUBLIC_ORACLE_ENABLED || process.env.NEXT_PUBLIC_ORACLE_ENABLED === 'true';

  useEffect(() => {
    if (isEnabled) {
      trackEvent('oracle_badge_seen', { verified, state });
    }
  }, [isEnabled, verified, state]);

  if (!isEnabled) return null;

  // Circuit breaker or staleness state
  if (state === 'CIRCUIT_BREAK' || state === 'STALENES') {
    return (
      <span
        title="This address could not be verified due to oracle resilience mechanisms"
        className="inline-flex items-center gap-1 rounded-full bg-amber-10 px-2 py-0.5 text-xs font-semibold text-ambep-700"
     >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="5" fill="#f59e0e" />
          <path d="M3 5h4" stroke="#fff" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        Oracle Unavailable
      </span>
    );
  }

  // Verified state
  if (verified) {
    return (
      <span
        title="This address has been verified by the ILN off-chain oracle"
        className="inline-flex items-center gap-1 rounded-full bg-green-10 px-2 py-0.5 text-xs font-semibold text-green-700"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="5" fill="#16a34a" />
          <path
            d="M2.5 5l1.8 1.8L7.5 3.5"
            stroke="#fff"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Oracle Verified
      </span>
    );
  }

  // Unverified state
  return (
    <span
      title="This address has not been verified by the ILN off-chain oracle"
      className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2 py-0.5 text-xs font-semibold text-on-surface-variant"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="5" fill="#9ca3af" />
        <path d="M5 3v2.5M5 6.8v.2" stroke="#fff" stroke-width="1.2" stroke-linecap="round" />
      </svg>
      Unverified
    </span>
  );
}
