"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import InvoiceMarketplaceCard from "@/components/InvoiceMarketplaceCard";
import Navbar from "@/components/Navbar";
import { useWallet } from "@/context/WalletContext";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  filterMarketplaceInvoices,
  paginateMarketplaceInvoices,
  sortMarketplaceInvoices,
  type MarketplaceFilters,
  type MarketplaceSortKey,
} from "@/utils/marketplace";
import {
  getAllInvoices,
  getPayerScoresBatch,
  type Invoice,
  type PayerScoreResult,
} from "@/utils/soroban";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS: MarketplaceFilters = {
  token: "",
  minYield: 0,
  maxAmount: "",
  minReputation: 0,
};

function MarketplaceSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5">
          <div className="h-4 w-28 rounded bg-surface-container-high" />
          <div className="mt-4 h-8 w-40 rounded bg-surface-container-high" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((__, itemIndex) => (
              <div key={itemIndex} className="h-10 rounded bg-surface-container-high" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MarketplacePage() {
  useDocumentTitle({ pageTitle: "Invoice Marketplace" });

  const { isConnected } = useWallet();
  const { tokens, tokenMap, defaultToken } = useApprovedTokens();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payerScores, setPayerScores] = useState<Map<string, PayerScoreResult | null>>(new Map());
  const [filters, setFilters] = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<MarketplaceSortKey>("yield");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMarketplace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allInvoices = await getAllInvoices();
      const pendingInvoices = allInvoices.filter((invoice) => invoice.status === "Pending");
      const uniquePayers = [...new Set(pendingInvoices.map((invoice) => invoice.payer))];
      const scores = await getPayerScoresBatch(uniquePayers);
      setInvoices(pendingInvoices);
      setPayerScores(scores);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load marketplace invoices.");
      setInvoices([]);
      setPayerScores(new Map());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadMarketplace();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadMarketplace]);

  const filteredInvoices = useMemo(
    () => filterMarketplaceInvoices({ invoices, filters, payerScores }),
    [filters, invoices, payerScores],
  );
  const sortedInvoices = useMemo(
    () => sortMarketplaceInvoices(filteredInvoices, sortKey),
    [filteredInvoices, sortKey],
  );
  const visibleInvoices = useMemo(
    () => paginateMarketplaceInvoices(sortedInvoices, page, PAGE_SIZE),
    [page, sortedInvoices],
  );
  const maxPage = Math.max(0, Math.ceil(sortedInvoices.length / PAGE_SIZE) - 1);

  const updateFilter = <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => {
    setPage(0);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const updateSortKey = (value: MarketplaceSortKey) => {
    setPage(0);
    setSortKey(value);
  };

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <section className="border-b border-outline-variant/10 bg-surface-container-lowest px-6 pb-8 pt-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">LP Marketplace</p>
          <h1 className="mt-2 text-3xl font-headline text-on-surface md:text-4xl">Invoice Marketplace</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Browse pending invoices available for funding and compare yield, due date, token, and payer reputation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 md:grid-cols-5">
          <label className="text-sm font-semibold text-on-surface">
            Sort by
            <select
              value={sortKey}
              onChange={(event) => updateSortKey(event.target.value as MarketplaceSortKey)}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm"
            >
              <option value="yield">Yield highest first</option>
              <option value="amount">Amount</option>
              <option value="due_date">Due date</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-on-surface">
            Token
            <select
              value={filters.token}
              onChange={(event) => updateFilter("token", event.target.value)}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm"
            >
              <option value="">All tokens</option>
              {tokens.map((token) => (
                <option key={token.contractId} value={token.contractId}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-on-surface">
            Min yield %
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.minYield}
              onChange={(event) => updateFilter("minYield", Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-on-surface">
            Max amount
            <input
              type="number"
              min="0"
              value={filters.maxAmount}
              onChange={(event) => updateFilter("maxAmount", event.target.value)}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm font-semibold text-on-surface">
            Min reputation
            <input
              type="number"
              min="0"
              max="100"
              value={filters.minReputation}
              onChange={(event) => updateFilter("minReputation", Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-on-surface-variant">
            {sortedInvoices.length.toLocaleString()} pending invoices available
          </p>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="rounded-lg border border-outline-variant/20 px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button
              type="button"
              disabled={page >= maxPage}
              onClick={() => setPage((current) => Math.min(maxPage, current + 1))}
              className="rounded-lg border border-outline-variant/20 px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <MarketplaceSkeleton />
          ) : error ? (
            <div className="rounded-lg border border-error/25 bg-error-container p-4 text-sm text-on-error-container">
              {error}
            </div>
          ) : visibleInvoices.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleInvoices.map((invoice) => (
                <InvoiceMarketplaceCard
                  key={invoice.id.toString()}
                  invoice={invoice}
                  token={tokenMap.get(invoice.token ?? "") ?? defaultToken}
                  payerScore={payerScores.get(invoice.payer) ?? null}
                  isWalletConnected={isConnected}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-10 text-center">
              <h2 className="text-lg font-bold text-on-surface">No pending invoices match these filters</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Adjust the filters or check back later.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
