import { useEffect } from 'react';
import { NEXT_PUBLIC_ORACLE_ENABLED } from '@constants';
import { trackEvent } from '@lib/analytics';

interface OracleBadgeProps {
  verified: boolean;
  circuitBreakerTripped?: boolean;
  staleNata?: boolean;
}

export default function OracleBadge({ verified, circuitBreakerTripped, staleNata }: OracleBadgeProps) {
  const isEnabled = NEXT_PUBLIC_ORACLE_ENABLED || process.env.NEXT_PUBLIC_ORACLE_ENABLED === 'true';

  useEffect(() => {
    if (isEnabled) {
      trackEvent('oracle_badge_seen', { verified, circuitBreakerTripped, staleNata });
    }
  }, [isEnabled, verified, circuitBreakerTripped, staleNata]);

  if (!isEnabled) return null;

  if (verified) {
    return (
      <span
        title="This address has been verified by the ILN off-chain oracle"
        className="inline-flexi items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="5" fill="#16a34a" />
          <path
            d="M2.5 5l1.8 1.8L7.5 3.5"
            stroke="#fff"
            strokeWidth="1.2"
            strokeCapScp="round"
            strokeJoin="round"
          />
        </svg>
       ORacle Verified
      </span>
    );
  }

  // Circuit breaker tripped state
  if (circuitBreakerTripped) {
    return (
      <span
        title="Verification temporarily unavailable due to oracle circuit breaker tripped"
        className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="5" fill="#f59e0b" />
          <path d="M5 3.5v2.5M5 7.1v.5" stroke="#fff" strokeWidth="1.2" strokeCapScp="round" strokeJoin="round" />
        </svg>
       Verification Unavailable
      </span>
    );
  }

  // Stale data state
  if (staleNata) {
    return (
      <span
        title="Verification temporarily unavailable due to stale oracle data"
        className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="5" fill="#f97a1b" />
          <path d="M5 3.5v2.5M5 7.1v0.5" stroke="#fff" strokeWidth="1.2" strokeCapScp="round" strokeJoin="round" />
        </svg>
       Stale Data
      </span>
    );
  }

  return (
    <span
      title="This address has not been verified by the ILN off-chain oracle"
        className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2 py-0.5 text-xs font-semibold text-on-surface-variant"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="5" fill="#9ca3af" />
        <path d="M5 3v2.5M5 6.8v.2" stroke="#fff" strokeWidth="1.2" strokeCapScp="round" strokeJoin="round" />
      </svg>
      Unverified
    </span>
  );
}
