"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import ActivityFeed from "@/components/ActivityFeed";
import ChangeInvoiceTokenModal from "@/components/ChangeInvoiceTokenModal";
import { TokenAmount } from "@/components/TokenSelector";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useWallet } from "@/context/WalletContext";
import { getInvoice, type Invoice } from "@/utils/soroban";
import { formatAddress, formatDate, formatTokenAmount, calculateYield } from "@/utils/format";

type LoadState = "loading" | "success" | "error";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = BigInt(id);
  const { address, connect } = useWallet();
  const { tokenMap, defaultToken } = useApprovedTokens();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [showChangeToken, setShowChangeToken] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoadState("loading");
      const nextInvoice = await getInvoice(invoiceId);
      setInvoice(nextInvoice);
      setError("");
      setLoadState("success");
    } catch {
      setError("Failed to load invoice details.");
      setLoadState("error");
    }
  }, [invoiceId]);

  useEffect(() => {
    void Promise.resolve().then(fetchInvoice);
  }, [fetchInvoice]);

  const token = useMemo(() => {
    if (!invoice) return defaultToken;
    return tokenMap.get(invoice.token ?? defaultToken?.contractId ?? "") ?? defaultToken;
  }, [defaultToken, invoice, tokenMap]);

  if (loadState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant/30 border-t-primary" />
      </main>
    );
  }

  if (loadState === "error" || !invoice) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <span className="material-symbols-outlined text-5xl text-error">error_outline</span>
          <h1 className="mt-4 text-2xl font-headline">Invoice Not Found</h1>
          <p className="mt-2 text-on-surface-variant">{error || "The requested invoice does not exist."}</p>
        </div>
      </main>
    );
  }

  const isSubmitter = address === invoice.freelancer;
  const canChangeToken = invoice.status === "Pending" && isSubmitter;
  const currentTokenLabel = token?.symbol ?? (invoice.token ? "Token" : "USDC");

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">Invoice Detail</p>
          <h1 className="font-headline text-3xl sm:text-4xl">Invoice #{invoice.id.toString()}</h1>
        </div>

        <section className="rounded-[24px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Status</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{invoice.status}</p>
            </div>
            {!address ? (
              <button
                type="button"
                onClick={connect}
                className="rounded-xl border border-outline-variant/25 px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
              >
                Connect Wallet
              </button>
            ) : canChangeToken ? (
              <button
                type="button"
                onClick={() => setShowChangeToken(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
              >
                Change Token
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow
              label="Invoice amount"
              value={
                token ? (
                  <TokenAmount amount={formatTokenAmount(invoice.amount, token)} token={token} />
                ) : (
                  `${invoice.amount.toString()} ${currentTokenLabel}`
                )
              }
            />
            <DetailRow label="Current token" value={currentTokenLabel} />
            <DetailRow label="Due date" value={formatDate(invoice.due_date)} />
            <DetailRow label="Discount rate" value={`${(invoice.discount_rate / 100).toFixed(2)}%`} />
            <DetailRow
              label="Estimated LP yield"
              value={
                token ? (
                  <TokenAmount amount={formatTokenAmount(calculateYield(invoice.amount, invoice.discount_rate), token)} token={token} />
                ) : (
                  calculateYield(invoice.amount, invoice.discount_rate).toString()
                )
              }
            />
            <DetailRow label="Freelancer" value={formatAddress(invoice.freelancer)} />
            <DetailRow label="Payer" value={formatAddress(invoice.payer)} />
            {invoice.funder ? <DetailRow label="Funder" value={formatAddress(invoice.funder)} /> : null}
          </div>

          {address && invoice.status === "Pending" && !isSubmitter ? (
            <div className="mt-6 rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              Only the submitting freelancer can change the invoice token before funding.
            </div>
          ) : null}
        </section>

        <ActivityFeed invoiceId={invoiceId} />
      </div>

      {showChangeToken ? (
        <ChangeInvoiceTokenModal
          invoice={invoice}
          submitter={address ?? ""}
          onClose={() => setShowChangeToken(false)}
          onSuccess={(newToken) => setInvoice((current) => (current ? { ...current, token: newToken } : current))}
        />
      ) : null}
    </main>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">{label}</p>
      <div className="mt-1 text-sm font-semibold text-on-surface">{value}</div>
    </div>
  );
}
