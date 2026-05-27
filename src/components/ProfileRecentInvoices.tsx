"use client";

import Link from "next/link";
import { Invoice } from "@/utils/soroban";
import { formatAddress, formatDate, formatUSDC } from "@/utils/format";

interface ProfileRecentInvoicesProps {
  invoices: Invoice[];
  address: string;
}

export default function ProfileRecentInvoices({ invoices, address }: ProfileRecentInvoicesProps) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 text-center text-on-surface-variant">
        No recent invoice activity found for this address.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
      <table className="w-full text-left">
        <thead className="bg-surface-container-low">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Invoice</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Role</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Counterparty</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Amount</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Status</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-on-surface-variant">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {invoices.map((invoice) => {
            const isSubmitter = invoice.freelancer === address;
            const counterparty = isSubmitter ? invoice.payer : invoice.freelancer;
            const counterpartyLabel = isSubmitter ? "Payer" : "Freelancer";
            const eventDate = invoice.funded_at ?? invoice.due_date;
            return (
              <tr key={invoice.id.toString()}>
                <td className="px-4 py-4 font-bold text-primary">#{invoice.id.toString()}</td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">{isSubmitter ? "Submitter" : "Payer"}</td>
                <td className="px-4 py-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <Link href={`/profile/${counterparty}`} className="font-mono text-sm text-primary hover:underline">
                      {formatAddress(counterparty)}
                    </Link>
                    <span className="text-[11px] uppercase tracking-[0.24em] text-on-surface-variant">
                      {counterpartyLabel}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 font-bold">{formatUSDC(invoice.amount)}</td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">{invoice.status}</td>
                <td className="px-4 py-4 text-sm text-on-surface-variant">{formatDate(eventDate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
