"use client";

import { use, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ReputationHistoryChart from "@/components/ReputationHistoryChart";
import { formatAddress, formatUSDC } from "@/utils/format";
import { ReputationUpdatedEvent } from "@/utils/reputation-history";
import { getAllInvoices, getPayerScore, Invoice, PayerScoreResult } from "@/utils/soroban";

function eventsFromInvoices(invoices: Invoice[]): ReputationUpdatedEvent[] {
  let score = 75;
  return invoices
    .filter((invoice) => invoice.status === "Paid" || invoice.status === "Defaulted")
    .sort((a, b) => {
      if (a.due_date === b.due_date) return 0;
      return a.due_date < b.due_date ? -1 : 1;
    })
    .map((invoice, index) => {
      const paid = invoice.status === "Paid";
      score = Math.max(0, Math.min(100, score + (paid ? 4 : -18)));
      return {
        type: "ReputationUpdated",
        score,
        eventType: paid ? "paid" : "defaulted",
        timestamp: Number(invoice.funded_at ?? invoice.due_date),
        ledger: 500000 + index * 1200,
      };
    });
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [score, setScore] = useState<PayerScoreResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAllInvoices(), getPayerScore(address)])
      .then(([all, payerScore]) => {
        if (cancelled) return;
        setInvoices(all.filter((invoice) => invoice.payer === address));
        setScore(payerScore);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const historyEvents = useMemo(() => eventsFromInvoices(invoices), [invoices]);
  const paidCount = invoices.filter((invoice) => invoice.status === "Paid").length;
  const defaultCount = invoices.filter((invoice) => invoice.status === "Defaulted").length;
  const settledVolume = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((total, invoice) => total + invoice.amount, 0n);

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="border-b border-outline-variant/10 bg-surface-container-lowest px-8 pb-10 pt-32">
        <div className="mx-auto max-w-7xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Public Profile</p>
          <h1 className="text-4xl font-headline">{formatAddress(address)}</h1>
          <p className="mt-3 max-w-2xl font-mono text-sm text-on-surface-variant">{address}</p>
        </div>
      </section>

      <section className="px-8 py-10">
        <div className="mx-auto grid max-w-7xl gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Reputation", loading ? "..." : `${score?.score ?? 0}/100`],
              ["Paid invoices", paidCount.toString()],
              ["Defaults", defaultCount.toString()],
              ["Settled volume", formatUSDC(settledVolume)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
                <p className="mt-2 text-2xl font-bold text-on-surface">{value}</p>
              </div>
            ))}
          </div>

          <ReputationHistoryChart events={historyEvents} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
