"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import InvoiceEventHistory from "@/components/InvoiceEventHistory";
import InvoiceStatusBadge from "@/components/InvoiceStatusBadge";
import InvoiceStatusTimeline from "@/components/InvoiceStatusTimeline";
import { NETWORK_NAME, TESTNET_USDC_TOKEN_ID } from "@/constants";
import { useToast } from "@/context/ToastContext";
import { useWallet } from "@/context/WalletContext";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { formatAddress, formatDate, formatTokenAmount } from "@/utils/format";
import {
  cancelInvoice,
  getInvoice,
  markPaid,
  submitSignedTransaction,
  type Invoice,
} from "@/utils/soroban";

type LoadState = "loading" | "success" | "error";
type ActionState = "idle" | "canceling" | "marking-paid";
type InvoiceWithPaidAmount = Invoice & { amount_paid?: bigint };
type PreparedTransaction = Awaited<ReturnType<typeof markPaid>>;

function parseInvoiceId(id: string): bigint | null {
  try {
    const parsed = BigInt(id);
    return parsed >= 0n ? parsed : null;
  } catch {
    return null;
  }
}

function formatRate(bps: number): string {
  return `${(bps / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function statusPaidAmount(invoice: Invoice): bigint {
  return (invoice as InvoiceWithPaidAmount).amount_paid ?? (invoice.status === "Paid" ? invoice.amount : 0n);
}

function unwrapPreparedTransaction(prepared: PreparedTransaction | { tx: PreparedTransaction }) {
  return typeof prepared === "object" && prepared !== null && "tx" in prepared ? prepared.tx : prepared;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-outline-variant/10 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm font-medium text-on-surface-variant">{label}</dt>
      <dd className="break-all text-sm font-semibold text-on-surface sm:text-right">{children}</dd>
    </div>
  );
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const invoiceId = useMemo(() => parseInvoiceId(id), [id]);
  const { address, connect, signTx } = useWallet();
  const { addToast, updateToast } = useToast();
  const { tokenMap, defaultToken } = useApprovedTokens();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>("idle");

  const fetchInvoice = useCallback(async () => {
    if (invoiceId === null) {
      setInvoice(null);
      setError("The invoice id is invalid.");
      setLoadState("error");
      return;
    }

    try {
      setLoadState("loading");
      setError(null);
      setInvoice(await getInvoice(invoiceId));
      setLoadState("success");
    } catch (loadError) {
      console.error(loadError);
      setInvoice(null);
      setError("Failed to load invoice details.");
      setLoadState("error");
    }
  }, [invoiceId]);

  useEffect(() => {
    void Promise.resolve().then(fetchInvoice);
  }, [fetchInvoice]);

  const token = invoice?.token ? tokenMap.get(invoice.token) : undefined;
  const displayToken = token ?? defaultToken ?? {
    contractId: invoice?.token ?? TESTNET_USDC_TOKEN_ID,
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
  };
  const isPayer = Boolean(address && invoice && address === invoice.payer);
  const isFreelancer = Boolean(address && invoice && address === invoice.freelancer);
  const isFunder = Boolean(address && invoice?.funder && address === invoice.funder);
  const canMarkPaid = Boolean(isPayer && invoice?.status === "Funded");
  const canCancel = Boolean(isFreelancer && invoice?.status === "Pending");

  const runAction = async (kind: Exclude<ActionState, "idle">) => {
    if (!address || !invoice || invoiceId === null) return;

    const isCancel = kind === "canceling";
    setActionState(kind);
    const toastId = addToast({
      type: "pending",
      title: isCancel ? "Canceling invoice..." : "Marking invoice paid...",
      message: "Please sign the transaction in Freighter.",
    });

    try {
      const prepared = isCancel
        ? await cancelInvoice(address, invoiceId)
        : await markPaid(address, invoiceId);
      const tx = unwrapPreparedTransaction(prepared);

      updateToast(toastId, { message: "Transaction prepared. Signing..." });
      const { txHash } = await submitSignedTransaction({ tx, signTx });

      updateToast(toastId, {
        type: "success",
        title: isCancel ? "Invoice Canceled" : "Invoice Marked Paid",
        message: isCancel
          ? "The invoice was canceled on-chain."
          : "The invoice was marked paid on-chain.",
        txHash,
      });
      await fetchInvoice();
    } catch (actionError) {
      console.error(actionError);
      updateToast(toastId, {
        type: "error",
        title: isCancel ? "Cancel Failed" : "Payment Update Failed",
        message: actionError instanceof Error ? actionError.message : "The transaction could not be completed.",
      });
    } finally {
      setActionState("idle");
    }
  };

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
          <h1 className="mt-4 font-headline text-2xl">Invoice Not Found</h1>
          <p className="mt-2 text-on-surface-variant">{error ?? "The requested invoice does not exist."}</p>
        </div>
      </main>
    );
  }

  const amountPaid = statusPaidAmount(invoice);

  return (
    <main className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
              Invoice Detail · {NETWORK_NAME}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-headline text-3xl sm:text-4xl">Invoice #{invoice.id.toString()}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>

          <section className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Lifecycle</p>
                <h2 className="mt-2 font-headline text-xl">Status progress</h2>
              </div>
              <span className="text-sm font-semibold text-on-surface-variant">Due {formatDate(invoice.due_date)}</span>
            </div>
            <InvoiceStatusTimeline invoice={invoice} />
          </section>

          <section className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Invoice fields</p>
            <dl className="mt-2">
              <DetailRow label="Amount">
                {formatTokenAmount(invoice.amount, displayToken)}
              </DetailRow>
              <DetailRow label="Amount paid">
                {formatTokenAmount(amountPaid, displayToken)}
              </DetailRow>
              <DetailRow label="Discount rate">{formatRate(invoice.discount_rate)}</DetailRow>
              <DetailRow label="Token">{displayToken.symbol}</DetailRow>
              <DetailRow label="Token contract">{invoice.token ?? displayToken.contractId}</DetailRow>
              <DetailRow label="Due date">{formatDate(invoice.due_date)}</DetailRow>
              <DetailRow label="Freelancer">
                <Link href={`/profile/${invoice.freelancer}`} className="text-primary hover:underline">
                  {formatAddress(invoice.freelancer)}
                </Link>
              </DetailRow>
              <DetailRow label="Payer">
                <Link href={`/profile/${invoice.payer}`} className="text-primary hover:underline">
                  {formatAddress(invoice.payer)}
                </Link>
              </DetailRow>
              <DetailRow label="Liquidity provider">
                {invoice.funder ? (
                  <Link href={`/profile/${invoice.funder}`} className="text-primary hover:underline">
                    {formatAddress(invoice.funder)}
                  </Link>
                ) : (
                  "Not funded yet"
                )}
              </DetailRow>
            </dl>
          </section>

          <InvoiceEventHistory invoiceId={invoice.id} />
        </div>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant">Actions</p>
            <h2 className="mt-2 font-headline text-xl">Role controls</h2>
            {!address ? (
              <button
                type="button"
                onClick={connect}
                className="mt-5 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary/90"
              >
                Connect wallet
              </button>
            ) : (
              <div className="mt-5 space-y-3">
                {isPayer ? (
                  <button
                    type="button"
                    onClick={() => runAction("marking-paid")}
                    disabled={!canMarkPaid || actionState !== "idle"}
                    className="w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionState === "marking-paid" ? "Marking paid..." : "Mark Paid"}
                  </button>
                ) : null}

                {isFreelancer ? (
                  <button
                    type="button"
                    onClick={() => runAction("canceling")}
                    disabled={!canCancel || actionState !== "idle"}
                    className="w-full rounded-2xl border border-error/30 bg-error/10 px-5 py-3 text-sm font-bold text-error transition hover:bg-error/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionState === "canceling" ? "Canceling..." : "Cancel Invoice"}
                  </button>
                ) : null}

                {isFunder ? (
                  <Link
                    href="/lp"
                    className="flex w-full items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-bold text-primary transition hover:bg-primary/15"
                  >
                    Transfer Position
                  </Link>
                ) : null}

                {!isPayer && !isFreelancer && !isFunder ? (
                  <p className="rounded-2xl border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                    No role-specific actions are available for this wallet.
                  </p>
                ) : null}
              </div>
            )}
            <p className="mt-4 text-xs leading-relaxed text-on-surface-variant">
              Mark paid is available to the payer after funding. Cancel is available to the freelancer before funding.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
