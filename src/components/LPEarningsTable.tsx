"use client";

import { useMemo, useState } from "react";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import type { Invoice } from "@/utils/soroban";
import {
  buildLPEarningsCsv,
  buildLPEarningsRows,
  formatEarningsPayer,
  getLPEarningsExportFilename,
} from "@/utils/lpEarnings";
import { downloadFile } from "@/utils/exportData";

interface LPEarningsTableProps {
  invoices: Invoice[];
  tokenMap?: Map<string, ApprovedToken>;
  defaultToken?: ApprovedToken | null;
}

const PAGE_SIZE = 20;

export default function LPEarningsTable({
  invoices,
  tokenMap = new Map(),
  defaultToken = null,
}: LPEarningsTableProps) {
  const [page, setPage] = useState(1);
  const rows = useMemo(
    () => buildLPEarningsRows(invoices, tokenMap, defaultToken),
    [defaultToken, invoices, tokenMap],
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const exportCsv = () => {
    downloadFile(
      buildLPEarningsCsv(rows),
      getLPEarningsExportFilename(),
      "text/csv;charset=utf-8;",
    );
  };

  return (
    <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface">
            Earnings History
          </h3>
          <p className="text-sm text-on-surface-variant">
            Settled LP positions for accounting and tax export.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-bold text-surface-container-lowest shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            download
          </span>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/10">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              {[
                "Invoice ID",
                "Payer",
                "Settlement Date",
                "Amount Funded",
                "Payout Received",
                "Earned",
                "Token",
                "Yield %",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-dim">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-on-surface-variant">
                  No settled LP earnings yet.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.invoiceId} className="hover:bg-surface-variant/10">
                  <td className="px-4 py-3 font-bold text-primary">#{row.invoiceId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatEarningsPayer(row.payer)}</td>
                  <td className="px-4 py-3 text-sm">{row.settlementDate}</td>
                  <td className="px-4 py-3 text-sm">{row.amountFunded}</td>
                  <td className="px-4 py-3 text-sm font-bold">{row.payoutReceived}</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600">{row.earned}</td>
                  <td className="px-4 py-3 text-sm">{row.token}</td>
                  <td className="px-4 py-3 text-sm">{row.yieldPercent}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-on-surface-variant">
        <span>
          Showing {visibleRows.length} of {rows.length} settled positions
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-outline-variant/20 px-3 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-bold">
            Page {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={currentPage === pageCount}
            className="rounded-lg border border-outline-variant/20 px-3 py-1 font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
