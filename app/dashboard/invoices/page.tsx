"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import { useWallet } from "@/context/WalletContext";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useSubmitterInvoices } from "@/hooks/useInvoices";
import {
  buildFreelancerInvoiceDashboard,
  FREELANCER_INVOICE_STATUSES,
  type FreelancerInvoiceSortKey,
  type FreelancerInvoiceStatusFilter,
  type SortDirection,
} from "@/utils/freelancerInvoiceDashboard";
import { formatAddress, formatDate, formatTokenAmount } from "@/utils/format";

const PAGE_SIZE = 20;

const SORT_LABELS: Record<FreelancerInvoiceSortKey, string> = {
  due_date: "Due Date",
  amount: "Amount",
  status: "Status",
};

export default function FreelancerInvoicesPage() {
  const { address, isConnected, connect } = useWallet();
  const { data: invoices = [], isLoading } = useSubmitterInvoices(address);
  const { tokenMap, defaultToken } = useApprovedTokens();
  const [statusFilter, setStatusFilter] = useState<FreelancerInvoiceStatusFilter>("All");
  const [sortKey, setSortKey] = useState<FreelancerInvoiceSortKey>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  const dashboard = useMemo(
    () =>
      buildFreelancerInvoiceDashboard({
        invoices,
        submitterAddress: null,
        statusFilter,
        sortKey,
        sortDirection,
        page,
        pageSize: PAGE_SIZE,
      }),
    [invoices, page, sortDirection, sortKey, statusFilter],
  );

  const skeletonRows = Array.from({ length: 5 }, (_, index) => index);

  const setFilter = (value: FreelancerInvoiceStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const setSort = (value: FreelancerInvoiceSortKey) => {
    setSortKey(value);
    setPage(1);
  };

  const setDirection = (value: SortDirection) => {
    setSortDirection(value);
    setPage(1);
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-surface px-6 py-10 text-on-surface">
        <section className="mx-auto flex max-w-3xl flex-col gap-5 rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Freelancer invoices</p>
            <h1 className="mt-3 text-3xl font-headline">Connect your wallet to view submitted invoices</h1>
            <p className="mt-3 text-sm text-on-surface-variant">
              The invoice dashboard is scoped to the connected submitter address.
            </p>
          </div>
          <button
            type="button"
            onClick={connect}
            className="w-fit rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-surface-container-lowest shadow-sm hover:bg-primary/90"
          >
            Connect Freighter
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-8 text-on-surface sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Freelancer invoices</p>
            <h1 className="mt-2 text-3xl font-headline">Submitted invoice dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Track submitted invoices for {address ? formatAddress(address) : "your wallet"} with status filters,
              sorting, and page-based pagination.
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex w-fit items-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-surface-container-lowest shadow-sm hover:bg-primary/90"
          >
            Submit invoice
          </Link>
        </div>

        <div className="grid gap-3 rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_180px]">
          <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setFilter(event.target.value as FreelancerInvoiceStatusFilter)}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-medium normal-case tracking-normal text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {FREELANCER_INVOICE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Sort by
            <select
              value={sortKey}
              onChange={(event) => setSort(event.target.value as FreelancerInvoiceSortKey)}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-medium normal-case tracking-normal text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {(Object.keys(SORT_LABELS) as FreelancerInvoiceSortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Direction
            <select
              value={sortDirection}
              onChange={(event) => setDirection(event.target.value as SortDirection)}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm font-medium normal-case tracking-normal text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-3xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant/15 px-5 py-4">
            <p className="text-sm font-bold">
              {dashboard.total} {dashboard.total === 1 ? "invoice" : "invoices"}
            </p>
            <p className="text-xs text-on-surface-variant">
              Page {dashboard.page} of {dashboard.pageCount}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-outline-variant/15">
              <thead className="bg-surface-container-low">
                <tr>
                  {["Invoice ID", "Payer", "Amount", "Token", "Status", "Due Date", "Action"].map((header) => (
                    <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {isLoading
                  ? skeletonRows.map((row) => (
                      <tr key={row}>
                        {Array.from({ length: 7 }, (_, cell) => (
                          <td key={cell} className="px-5 py-4">
                            <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-surface-container-high" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : dashboard.items.map((invoice) => {
                      const token = tokenMap.get(invoice.token ?? "") ?? defaultToken;
                      const tokenSymbol = token?.symbol ?? "TOKEN";
                      return (
                        <tr key={invoice.id.toString()} className="hover:bg-surface-container-low/70">
                          <td className="px-5 py-4 font-mono text-sm">#{invoice.id.toString()}</td>
                          <td className="px-5 py-4 font-mono text-sm">{formatAddress(invoice.payer)}</td>
                          <td className="px-5 py-4 text-sm font-bold">
                            {token ? formatTokenAmount(invoice.amount, token) : invoice.amount.toString()}
                          </td>
                          <td className="px-5 py-4 text-sm">{tokenSymbol}</td>
                          <td className="px-5 py-4">
                            <InvoiceStatusBadge status={invoice.status} />
                          </td>
                          <td className="px-5 py-4 text-sm">{formatDate(invoice.due_date)}</td>
                          <td className="px-5 py-4">
                            <Link href={`/pay/${invoice.id.toString()}`} className="text-sm font-bold text-primary hover:underline">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {!isLoading && dashboard.items.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-base font-bold">No submitted invoices found</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Try a different status filter or submit a new invoice from the freelancer flow.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={dashboard.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-xl border border-outline-variant/20 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={dashboard.page >= dashboard.pageCount}
            onClick={() => setPage((current) => Math.min(dashboard.pageCount, current + 1))}
            className="rounded-xl border border-outline-variant/20 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
