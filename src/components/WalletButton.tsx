"use client";

import { useMemo, useState } from "react";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useBalances } from "@/hooks/useBalances";
import { useWallet } from "@/context/WalletContext";
import { TokenAmount } from "./TokenSelector";
import { formatAddress, formatTokenAmount } from "@/utils/format";
import { NETWORK_NAME } from "@/constants";
import TestnetFaucetButton from "./TestnetFaucetButton";

export default function WalletButton() {
  const { address, isConnected, isInstalled, connect, disconnect, networkMismatch, error } = useWallet();
  const { tokens } = useApprovedTokens();
  const allowedTokens = useMemo(() => tokens.filter((token) => token.isAllowed), [tokens]);
  // Auto-refreshes every 30s and on each successful transaction; tokens that
  // fail to load surface via `unavailable` for the "Add Trustline" prompt.
  const { balances, unavailable, isLoading: isLoadingBalances } = useBalances(tokens);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — nothing actionable to surface.
    }
  };

  if (isConnected) {
    return (
      <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${networkMismatch ? 'bg-error animate-pulse' : 'bg-green-500'}`}></span>
            <span className={`text-[10px] font-bold uppercase ${networkMismatch ? 'text-error' : 'text-primary'}`}>
              {networkMismatch ? "Wrong Network" : NETWORK_NAME}
            </span>
          </div>
          {!networkMismatch ? (
            <div className="flex flex-wrap justify-end gap-2">
              {isLoadingBalances && balances.size === 0 && unavailable.size === 0 ? (
                <span className="rounded-full border border-outline-variant/15 bg-surface-container-low px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Loading balances...
                </span>
              ) : (
                allowedTokens.map((token) => {
                  const amount = balances.get(token.contractId);
                  const isUnavailable = unavailable.has(token.contractId);
                  // Not yet loaded and not flagged unavailable — skip until it resolves.
                  if (amount === undefined && !isUnavailable) return null;

                  return (
                    <span
                      key={token.contractId}
                      className="flex items-center gap-1.5 rounded-full border border-outline-variant/15 bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface"
                    >
                      <TokenAmount amount={formatTokenAmount(amount ?? 0n, token)} token={token} />
                      {isUnavailable ? (
                        <button
                          type="button"
                          onClick={connect}
                          title={`No ${token.symbol} trustline found for this wallet. Add one to hold ${token.symbol}.`}
                          className="rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-primary-container hover:bg-primary-container/80 transition-colors"
                        >
                          Add Trustline
                        </button>
                      ) : null}
                    </span>
                  );
                })
              )}
            </div>
          ) : null}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-on-surface-variant">{formatAddress(address!)}</span>
            <button
              type="button"
              onClick={() => void handleCopyAddress()}
              aria-label="Copy wallet address"
              title={copied ? "Copied!" : "Copy address"}
              className="flex h-5 w-5 items-center justify-center rounded text-on-surface-variant hover:bg-surface-variant/50"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? "check" : "content_copy"}
              </span>
            </button>
          </div>
          <TestnetFaucetButton />
        </div>
        <button
          onClick={disconnect}
          className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface-dim transition-all active:scale-95 border border-outline-variant/10"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={connect}
        className="flex min-h-11 items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-surface-container-lowest shadow-md transition-all duration-150 hover:bg-primary/90 active:scale-95"
      >
        <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
        Connect Wallet
      </button>
      {!isInstalled && (
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block text-right text-[11px] font-medium text-primary hover:underline"
        >
          Don&apos;t have Freighter? Install it →
        </a>
      )}
      {error && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-error-container text-on-error-container text-xs rounded-lg shadow-xl border border-error/10 w-64 z-[60] animate-in slide-in-from-top-1 duration-200">
          <p className="font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            Connection Error
          </p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}
    </div>
  );
}
