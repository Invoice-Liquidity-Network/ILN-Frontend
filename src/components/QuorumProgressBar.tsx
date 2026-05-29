"use client";

interface QuorumProgressBarProps {
  totalVotes: number;
  totalSupply: number;
  quorumBps: number;
  compact?: boolean;
}

function formatAmount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export default function QuorumProgressBar({
  totalVotes,
  totalSupply,
  quorumBps,
  compact = false,
}: QuorumProgressBarProps) {
  const quorumRequired = Math.ceil((totalSupply * quorumBps) / 10_000);
  const progress = quorumRequired > 0 ? Math.min((totalVotes / quorumRequired) * 100, 100) : 0;
  const quorumReached = totalVotes >= quorumRequired;

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2.5"}>
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold ${
            quorumReached ? "text-emerald-500" : "text-red-500"
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {quorumReached ? "check_circle" : "radio_button_unchecked"}
          </span>
          Quorum: {formatAmount(totalVotes)} / {formatAmount(quorumRequired)} required
        </span>
        <span className="text-xs font-semibold text-on-surface-variant">
          {progress.toFixed(1)}%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high"
        role="progressbar"
        aria-label="Quorum progress"
        aria-valuemin={0}
        aria-valuemax={quorumRequired}
        aria-valuenow={Math.min(totalVotes, quorumRequired)}
      >
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${
            quorumReached ? "bg-emerald-500" : "bg-red-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
