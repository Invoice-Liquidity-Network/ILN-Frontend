"use client";

import Link from "next/link";
import {
  effectiveVotingPower,
  formatVotingPower,
  type VotingPowerBreakdown,
} from "@/utils/governance";

interface VotingPowerCardProps {
  isConnected: boolean;
  breakdown: VotingPowerBreakdown | null;
  isLoading?: boolean;
  onConnect: () => void;
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export default function VotingPowerCard({
  isConnected,
  breakdown,
  isLoading = false,
  onConnect,
}: VotingPowerCardProps) {
  const effectivePower = breakdown ? effectiveVotingPower(breakdown) : 0;

  return (
    <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Your Voting Power
          </p>
          {isConnected ? (
            <p className="mt-2 text-3xl font-bold text-primary">
              {isLoading ? "Loading..." : formatVotingPower(effectivePower)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-on-surface-variant">
              Connect your wallet to see your governance weight.
            </p>
          )}
        </div>

        {isConnected ? (
          <Link
            href="#delegation-management"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-bold text-on-surface-variant hover:border-primary/40 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">account_tree</span>
            Manage delegation
          </Link>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-primary/90 active:scale-95 transition-all"
          >
            Connect wallet
          </button>
        )}
      </div>

      {isConnected && breakdown ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-container-low px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Own balance
            </p>
            <p className="mt-1 text-base font-bold text-on-surface">
              {formatVotingPower(breakdown.ownBalance)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Incoming delegation
            </p>
            <p className="mt-1 text-base font-bold text-on-surface">
              {formatVotingPower(breakdown.incomingDelegated)}
            </p>
          </div>
        </div>
      ) : null}

      {isConnected && breakdown?.delegatedTo ? (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          Your voting power is currently delegated to{" "}
          <span className="font-mono font-bold">{formatAddress(breakdown.delegatedTo)}</span>
        </div>
      ) : null}

      <div id="delegation-management" className="sr-only" aria-hidden="true" />
    </section>
  );
}
