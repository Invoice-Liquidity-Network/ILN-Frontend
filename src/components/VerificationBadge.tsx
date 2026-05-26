"use client";

import { isOracleVerificationEnabled } from "@/utils/oracleVerification";

export default function VerificationBadge({ verified }: { verified: boolean }) {
  if (!isOracleVerificationEnabled()) {
    return null;
  }

  const label = verified ? "Verified" : "Unverified";
  const icon = verified ? "check_circle" : "radio_button_unchecked";
  const tooltip = verified
    ? "This address has been verified by the ILN off-chain oracle"
    : "This address has not been verified by the ILN off-chain oracle";
  const classes = verified
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
    : "border-outline-variant/30 bg-surface-container text-on-surface-variant";

  return (
    <span className="group relative inline-flex">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${classes}`}
        aria-label={`${label}: ${tooltip}`}
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          {icon}
        </span>
        {label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-56 -translate-x-1/2 rounded-xl border border-outline-variant/20 bg-surface-container-high px-3 py-2 text-xs font-medium text-on-surface shadow-lg group-hover:block group-focus-within:block"
      >
        {tooltip}
      </span>
    </span>
  );
}
