"use client";

import { useEffect, useMemo, useState } from "react";

interface ExpiryCountdownProps {
  dueDate: bigint | number;
  className?: string;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function dueDateToMs(dueDate: bigint | number): number {
  return Number(dueDate) * 1000;
}

function getExpiryState(dueDate: bigint | number, nowMs: number) {
  const diffMs = dueDateToMs(dueDate) - nowMs;

  if (diffMs <= 0) {
    return {
      text: "Expired",
      tone: "bg-surface-dim text-on-surface-variant border-outline-variant/30",
      ariaLabel: "Invoice expired",
    };
  }

  const days = Math.floor(diffMs / DAY_MS);
  const hours = Math.floor((diffMs % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((diffMs % HOUR_MS) / MINUTE_MS);
  const timeText = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
  const tone =
    diffMs < DAY_MS
      ? "bg-red-500/10 text-red-600 border-red-500/30"
      : diffMs <= 7 * DAY_MS
        ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
        : "bg-green-500/10 text-green-600 border-green-500/30";

  return {
    text: `Expires in ${timeText}`,
    tone,
    ariaLabel: `Invoice expires in ${timeText}`,
  };
}

export default function ExpiryCountdown({ dueDate, className = "" }: ExpiryCountdownProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    void Promise.resolve().then(() => setNowMs(Date.now()));
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, MINUTE_MS);

    return () => window.clearInterval(intervalId);
  }, [dueDate]);

  const expiry = useMemo(() => getExpiryState(dueDate, nowMs), [dueDate, nowMs]);

  return (
    <span
      aria-label={expiry.ariaLabel}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${expiry.tone} ${className}`}
    >
      {expiry.text}
    </span>
  );
}
