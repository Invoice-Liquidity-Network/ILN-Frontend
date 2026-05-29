"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useTransaction } from "@/hooks/useTransaction";
import {
  delegateVotes,
  DelegationStatus,
  formatVotingPower,
  getDelegationStatus,
  isValidStellarAddress,
  resolveDelegateAddress,
  ResolvedDelegateAddress,
  undelegateVotes,
  wouldCreateDelegationCycle,
} from "@/utils/governance";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function VoteDelegationPanel() {
  const { address, isConnected, connect, signTx } = useWallet();
  const [status, setStatus] = useState<DelegationStatus | null>(null);
  const [delegateInput, setDelegateInput] = useState("");
  const [resolvedDelegate, setResolvedDelegate] = useState<ResolvedDelegateAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cycleWarning, setCycleWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const delegateTransaction = useTransaction({
    pendingTitle: "Delegating votes...",
    successTitle: "Votes delegated",
    errorTitle: "Delegation failed",
  });
  const undelegateTransaction = useTransaction({
    pendingTitle: "Removing delegation...",
    successTitle: "Delegation removed",
    errorTitle: "Undelegation failed",
  });

  const loadStatus = useCallback(async () => {
    if (!address) {
      setStatus(null);
      return;
    }

    setIsLoading(true);
    try {
      setStatus(await getDelegationStatus(address));
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    const timeout = window.setTimeout(loadStatus, 0);
    return () => window.clearTimeout(timeout);
  }, [loadStatus]);

  const resolveInput = useCallback(async () => {
    const value = delegateInput.trim();
    setResolvedDelegate(null);
    setCycleWarning(false);

    if (!value) {
      setError(null);
      return null;
    }

    setIsResolving(true);
    try {
      const resolved = await resolveDelegateAddress(value);
      setResolvedDelegate(resolved);
      setError(null);
      if (address) {
        setCycleWarning(await wouldCreateDelegationCycle(address, resolved.address));
      }
      return resolved;
    } catch (resolveError) {
      const message = resolveError instanceof Error ? resolveError.message : "Could not resolve delegate address.";
      setError(message);
      return null;
    } finally {
      setIsResolving(false);
    }
  }, [address, delegateInput]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!address) return;

    const resolved = resolvedDelegate ?? (await resolveInput());
    if (!resolved) return;
    if (resolved.address === address) {
      setError("You cannot delegate to yourself.");
      return;
    }
    if (cycleWarning) return;

    try {
      await delegateTransaction.runTransaction(() => delegateVotes(resolved.address, address, signTx));
      setDelegateInput("");
      setResolvedDelegate(null);
      await loadStatus();
    } catch (transactionError) {
      setError(transactionError instanceof Error ? transactionError.message : "Delegation failed.");
    }
  };

  const handleUndelegate = async () => {
    if (!address) return;

    try {
      await undelegateTransaction.runTransaction(() => undelegateVotes(address, signTx));
      await loadStatus();
    } catch (transactionError) {
      setError(transactionError instanceof Error ? transactionError.message : "Undelegation failed.");
    }
  };

  const delegateAddress = resolvedDelegate?.address ?? "";
  const delegateInvalid =
    !delegateAddress ||
    !isValidStellarAddress(delegateAddress) ||
    delegateAddress === address ||
    cycleWarning ||
    isResolving;

  return (
    <section className="mb-8 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
            Vote delegation
          </p>
          <h2 className="text-2xl font-headline mb-2">Delegate governance power</h2>
          <p className="max-w-2xl text-sm text-on-surface-variant leading-relaxed">
            Let a trusted representative vote with your ILN power, or remove delegation before voting directly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[520px]">
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-xs text-on-surface-variant mb-1">Own balance</p>
            <p className="text-lg font-bold">{status ? formatVotingPower(status.ownVotingPower) : "-"}</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-4">
            <p className="text-xs text-on-surface-variant mb-1">Incoming delegations</p>
            <p className="text-lg font-bold">
              {status ? formatVotingPower(status.incomingDelegationPower) : "-"}
            </p>
          </div>
          <div className="rounded-xl bg-primary/10 p-4">
            <p className="text-xs text-primary mb-1">Controlled voting weight</p>
            <p className="text-lg font-bold text-primary">
              {status ? formatVotingPower(status.controlledVotingPower) : "-"}
            </p>
          </div>
        </div>
      </div>

      {!isConnected ? (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-on-surface-variant">Connect your wallet to manage vote delegation.</span>
          <button
            onClick={connect}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">account_balance_wallet</span>
            Connect wallet
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-sm font-semibold mb-2">Current delegation status</p>
            {isLoading ? (
              <div className="h-6 w-48 animate-pulse rounded bg-surface-container-high" />
            ) : status?.delegatee ? (
              <p className="text-sm text-on-surface-variant">
                You are delegating to{" "}
                <span className="font-bold text-on-surface">{shortenAddress(status.delegatee)}</span>
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant">Not delegating</p>
            )}
            {status ? (
              <p className="mt-3 text-xs text-on-surface-variant">
                {status.incomingDelegatorCount} wallet{status.incomingDelegatorCount === 1 ? "" : "s"}{" "}
                {status.incomingDelegatorCount === 1 ? "delegates" : "delegate"} to you.
              </p>
            ) : null}
            <button
              onClick={handleUndelegate}
              disabled={!status?.delegatee || undelegateTransaction.isPending}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 py-2 text-sm font-bold transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_remove</span>
              Undelegate
            </button>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
            <label htmlFor="delegate-address" className="text-sm font-semibold">
              Delegate address
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="delegate-address"
                value={delegateInput}
                onChange={(event) => {
                  setDelegateInput(event.target.value);
                  setResolvedDelegate(null);
                  setCycleWarning(false);
                  setError(null);
                }}
                onBlur={() => void resolveInput()}
                placeholder="G... or alice*example.com"
                className="min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              />
              <button
                type="submit"
                disabled={delegateInvalid || delegateTransaction.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
                Delegate
              </button>
            </div>

            {isResolving ? (
              <p className="mt-3 text-xs text-on-surface-variant">Resolving delegate address...</p>
            ) : null}
            {resolvedDelegate ? (
              <p className="mt-3 text-xs text-primary">
                Resolved to {shortenAddress(resolvedDelegate.address)}
                {resolvedDelegate.federationName ? ` from ${resolvedDelegate.federationName}` : ""}
              </p>
            ) : null}
            {cycleWarning ? (
              <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
                You cannot delegate to an address that delegates back to you
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      )}
    </section>
  );
}
