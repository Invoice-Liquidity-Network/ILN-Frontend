"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useToast } from "@/context/ToastContext";
import { useWallet } from "@/context/WalletContext";
import { NETWORK_NAME } from "@/constants";
import {
  formatSupportedTokenAmount,
  getFallbackSupportedTokens,
  getSupportedTokens,
  type SupportedTokenInfo,
} from "@/utils/supportedTokens";
import { addTokenTrustline } from "@/utils/trustline";

type LoadState = "loading" | "success" | "error";

function shorten(value: string): string {
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function TokenLogo({ symbol }: { symbol: string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container text-sm font-bold text-on-primary-container">
      {symbol.slice(0, 4).toUpperCase()}
    </div>
  );
}

export default function SupportedTokensPage() {
  const { address, isConnected, connect, signTx } = useWallet();
  const { addToast, updateToast } = useToast();
  const [tokens, setTokens] = useState<SupportedTokenInfo[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [addingTrustline, setAddingTrustline] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setLoadState("loading");
    try {
      const nextTokens = await getSupportedTokens();
      setTokens(nextTokens);
      setLoadState("success");
      setErrorMessage("");
    } catch (error) {
      setTokens(getFallbackSupportedTokens());
      setLoadState("error");
      setErrorMessage(
        `Live token allowlist unavailable: ${
          error instanceof Error ? error.message : "Failed to load supported tokens."
        }`
      );
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchTokens);
  }, [fetchTokens]);

  const totalVolume = useMemo(
    () => tokens.reduce((total, token) => total + token.protocolVolume, 0n),
    [tokens]
  );

  const handleAddTrustline = async (token: SupportedTokenInfo) => {
    if (!isConnected || !address) {
      await connect();
      return;
    }

    const toastId = addToast({
      type: "pending",
      title: `Adding ${token.assetCode} to wallet...`,
      message: token.issuerAddress
        ? "Confirm the change trust transaction in Freighter."
        : "Confirm the token in Freighter.",
    });

    try {
      setAddingTrustline(token.contractId);
      const result = await addTokenTrustline(token, address, signTx);
      updateToast(toastId, {
        type: "success",
        title: `${token.assetCode} added to wallet`,
        txHash: result.hash,
      });
    } catch (error) {
      updateToast(toastId, {
        type: "error",
        title: "Wallet add failed",
        message: error instanceof Error ? error.message : "Unable to add the token.",
      });
    } finally {
      setAddingTrustline(null);
    }
  };

  return (
    <main className="min-h-screen bg-background text-on-background">
      <Navbar />
      <section className="px-6 pb-16 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
                {NETWORK_NAME} allowlist
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
                Supported Tokens
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
                Live protocol allowlist, Stellar asset details, protocol volume, acquisition links, and wallet trustline actions.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-60"
              onClick={fetchTokens}
              disabled={loadState === "loading"}
            >
              <RefreshCw className={`h-4 w-4 ${loadState === "loading" ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-5">
              <div className="text-sm text-on-surface-variant">Live allowlisted tokens</div>
              <div className="mt-2 text-3xl font-bold text-on-surface">
                {tokens.filter((token) => token.isLiveAllowlisted && !token.isNative).length}
              </div>
            </div>
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-5">
              <div className="text-sm text-on-surface-variant">Displayed assets</div>
              <div className="mt-2 text-3xl font-bold text-on-surface">{tokens.length}</div>
            </div>
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-5">
              <div className="text-sm text-on-surface-variant">Protocol volume units</div>
              <div className="mt-2 text-3xl font-bold text-on-surface">{totalVolume.toString()}</div>
            </div>
          </div>

          {loadState === "error" && (
            <div className="mb-8 rounded-lg border border-error/25 bg-error/10 p-4 text-sm text-error">
              {errorMessage}
              <span className="block pt-1 text-on-surface-variant">
                Showing configured token details until the contract responds.
              </span>
            </div>
          )}

          {loadState === "loading" && tokens.length === 0 ? (
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-8 text-center text-on-surface-variant">
              Loading live token allowlist...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {tokens.map((token) => (
                <article
                  key={token.contractId}
                  className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <TokenLogo symbol={token.symbol} />
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold text-on-surface">{token.name}</h2>
                        <div className="text-sm font-semibold text-primary">{token.symbol}</div>
                      </div>
                    </div>
                    {token.isLiveAllowlisted && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-tertiary-container px-2.5 py-1 text-xs font-semibold text-on-tertiary-container">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Live
                      </span>
                    )}
                  </div>

                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-on-surface-variant">Asset code</dt>
                      <dd className="mt-1 font-semibold text-on-surface">{token.assetCode}</dd>
                    </div>
                    <div>
                      <dt className="text-on-surface-variant">Issuer</dt>
                      <dd className="mt-1 break-all font-mono text-xs text-on-surface" title={token.issuer}>
                        {shorten(token.issuer)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-on-surface-variant">Contract</dt>
                      <dd className="mt-1 break-all font-mono text-xs text-on-surface" title={token.contractId}>
                        {shorten(token.contractId)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-on-surface-variant">Current protocol volume</dt>
                      <dd className="mt-1 font-semibold text-on-surface">
                        {formatSupportedTokenAmount(token.protocolVolume, token.decimals, token.symbol)}
                      </dd>
                    </div>
                  </dl>

                  <ul className="mt-5 space-y-2 text-sm leading-6 text-on-surface-variant">
                    {token.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-col gap-3">
                    <a
                      href={token.acquireUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant"
                    >
                      Acquire
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-surface-variant disabled:text-on-surface-variant"
                      onClick={() => handleAddTrustline(token)}
                      disabled={token.isNative || addingTrustline === token.contractId}
                    >
                      <Wallet className="h-4 w-4" />
                      {token.isNative
                        ? "Native asset"
                        : !isConnected
                          ? "Connect wallet"
                          : addingTrustline === token.contractId
                            ? "Adding..."
                            : "Add to Wallet"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
