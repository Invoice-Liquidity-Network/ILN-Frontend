"use client";

import { useCallback, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import LPPositionTable from "@/components/LPPositionTable";
import LPStatsCards from "@/components/LPStatsCards";
import Navbar from "@/components/Navbar";
import { useWallet } from "@/context/WalletContext";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  getLPPortfolioStats,
  listInvoicesByLP,
  type Invoice,
  type LPPortfolioStats,
} from "@/utils/soroban";

const PAGE_SIZE = 10;

export default function LPPortfolioDashboardPage() {
  useDocumentTitle({ pageTitle: "LP Portfolio" });

  const { address, isConnected, connect } = useWallet();
  const { tokenMap, defaultToken } = useApprovedTokens();
  const [stats, setStats] = useState<LPPortfolioStats | null>(null);
  const [positions, setPositions] = useState<Invoice[]>([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);
    try {
      const [nextStats, nextPositions] = await Promise.all([
        getLPPortfolioStats(address),
        listInvoicesByLP(address, page, PAGE_SIZE),
      ]);
      setStats(nextStats);
      setPositions(nextPositions.filter((position) => position.status === "Funded"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load LP portfolio.");
      setStats(null);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPortfolio();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadPortfolio]);

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <section className="border-b border-outline-variant/10 bg-surface-container-lowest px-6 pb-8 pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Liquidity Provider</p>
              <h1 className="mt-2 text-3xl font-headline text-on-surface md:text-4xl">LP Portfolio Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                Track deployed capital, yield, and active funded invoices for the connected wallet.
              </p>
            </div>
            {!isConnected && (
              <button
                type="button"
                onClick={() => void connect()}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary/90"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {!address ? (
          <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-primary">account_balance_wallet</span>
            <h2 className="mt-3 text-xl font-bold text-on-surface">Connect an LP wallet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-on-surface-variant">
              Portfolio stats and active positions are scoped to the wallet that funded invoices.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg border border-error/25 bg-error-container p-4 text-sm text-on-error-container">
                {error}
              </div>
            )}
            <LPStatsCards
              stats={stats}
              tokenMap={tokenMap}
              defaultToken={defaultToken}
              isLoading={isLoading}
            />
            <LPPositionTable
              positions={positions}
              isLoading={isLoading}
              page={page}
              pageSize={PAGE_SIZE}
              hasNextPage={positions.length === PAGE_SIZE}
              tokenMap={tokenMap}
              defaultToken={defaultToken}
              onPageChange={(nextPage) => setPage(Math.max(0, nextPage))}
            />
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}
