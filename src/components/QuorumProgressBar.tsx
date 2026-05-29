"use client";

import { useEffect, useState } from "react";

interface QuorumProgressBarProps {
  votesCast: number;
  quorumRequired: number;
  className?: string;
}

function formatVotes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function QuorumProgressBar({
  votesCast,
  quorumRequired,
  className = "",
}: QuorumProgressBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [votesCast, quorumRequired]);

  const quorumMet = votesCast >= quorumRequired;
  const pct =
    quorumRequired > 0
      ? Math.min((votesCast / quorumRequired) * 100, 100)
      : 0;
  const fillWidth = mounted ? pct : 0;

  return (
    <div className={`space-y-2 ${className}`} data-testid="quorum-progress-bar">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={`font-semibold ${quorumMet ? "text-emerald-600" : "text-red-600"}`}
        >
          Quorum: {formatVotes(votesCast)} / {formatVotes(quorumRequired)} required (
          {pct.toFixed(0)}%)
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high"
        role="progressbar"
        aria-valuenow={votesCast}
        aria-valuemin={0}
        aria-valuemax={quorumRequired}
        aria-label={`Quorum progress: ${pct.toFixed(0)}%`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${
            quorumMet ? "bg-emerald-500" : "bg-red-500"
          }`}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
    </div>
  );
}
