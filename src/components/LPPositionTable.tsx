"use client";

import Link from "next/link";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import type { Invoice } from "@/utils/soroban";
import { calculateYield, formatDate, formatTokenAmount } from "@/utils/format";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import SkeletonRow from "./SkeletonRow";

interface LPPositionTableProps {
  positions: Invoice[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  tokenMap: Map<string, ApprovedToken>;
  defaultToken: ApprovedToken | null;
  onPageChange: (page: number) => void;
}

const POSITION_COLUMNS = ["w-8", "w-24", "w-16", "w-20", "w-20", "w-20", "w-28"];

function resolveToken(invoice: Invoice, tokenMap: Map<string, ApprovedToken>, defaultToken: ApprovedToken | null) {
  return tokenMap.get(invoice.token ?? "") ?? defaultToken ?? { symbol: "USDC", decimals: 7 };
}

export default function LPPositionTable({
  positions,
  isLoading,
  page,
  pageSize,
  hasNextPage,
  tokenMap,
  defaultToken,
  onPageChange,
}: LPPositionTableProps) {
  return (
    <section className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest">
      <div className="flex flex-col gap-2 border-b border-outline-variant/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Active Funded Invoices</h2>
          <p className="text-sm text-on-surface-variant">Positions funded by the connected LP wallet.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0 || isLoading}
            className="rounded-lg border border-outline-variant/20 px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="min-w-16 text-center">Page {page + 1}</span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || isLoading}
            className="rounded-lg border border-outline-variant/20 px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              {["Invoice ID", "Amount Funded", "Token", "Effective Yield", "Due Date", "Status", ""].map((heading) => (
                <th key={heading} className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-dim">
            {isLoading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, index) => (
                <SkeletonRow key={index} columns={POSITION_COLUMNS} rowClass="py-4" />
              ))
            ) : positions.length > 0 ? (
              positions.map((position) => {
                const token = resolveToken(position, tokenMap, defaultToken);
                return (
                  <tr key={position.id.toString()} className="text-sm text-on-surface">
                    <td className="px-5 py-4 font-bold text-primary">#{position.id.toString()}</td>
                    <td className="px-5 py-4 font-bold">{formatTokenAmount(position.amount, token)}</td>
                    <td className="px-5 py-4">{token.symbol}</td>
                    <td className="px-5 py-4">{formatTokenAmount(calculateYield(position.amount, position.discount_rate), token)}</td>
                    <td className="px-5 py-4">{formatDate(position.due_date)}</td>
                    <td className="px-5 py-4">
                      <InvoiceStatusBadge status={position.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/pay/${position.id.toString()}?action=transfer-position`}
                        className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                      >
                        Transfer Position
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant">
                  No active funded invoices found for this LP wallet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
