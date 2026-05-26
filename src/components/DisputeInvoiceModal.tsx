"use client";

import { FormEvent, useState } from "react";
import type { Invoice } from "@/utils/soroban";
import { hashDisputeEvidence } from "@/utils/disputeEvidence";
import { formatUSDC } from "@/utils/format";

interface DisputeInvoiceModalProps {
  invoice: Invoice | null;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onDispute: (reasonHash: string, evidence: string) => Promise<void> | void;
}

export default function DisputeInvoiceModal({
  invoice,
  isSubmitting,
  error,
  onClose,
  onDispute,
}: DisputeInvoiceModalProps) {
  const [evidence, setEvidence] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const trimmedEvidence = evidence.trim();

  if (!invoice) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedEvidence) {
      setValidationError("Evidence description is required.");
      return;
    }

    setValidationError(null);
    const reasonHash = await hashDisputeEvidence(trimmedEvidence);
    await onDispute(reasonHash, trimmedEvidence);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-invoice-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-error">Dispute</p>
            <h2 id="dispute-invoice-title" className="mt-1 text-2xl font-headline">
              Raise Dispute
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            aria-label="Close dispute modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-on-surface-variant">Invoice</span>
            <span className="font-bold">#{invoice.id.toString()}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-on-surface-variant">Amount</span>
            <span className="font-bold">{formatUSDC(invoice.amount)}</span>
          </div>
        </div>

        <label className="mt-5 block text-sm font-semibold" htmlFor="dispute-evidence">
          Evidence description
        </label>
        <textarea
          id="dispute-evidence"
          value={evidence}
          onChange={(event) => {
            setEvidence(event.target.value);
            setValidationError(null);
          }}
          className="mt-2 min-h-36 w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
          placeholder="Describe why this invoice is incorrect."
          aria-describedby="dispute-warning dispute-error"
        />
        <p id="dispute-error" className="mt-2 min-h-5 text-sm text-error">
          {validationError ?? error}
        </p>

        <div
          id="dispute-warning"
          className="mt-4 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500"
        >
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <p>
            Your evidence description will be hashed and recorded on-chain. Save this text — you will need to share it with governance.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant/30 px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-error px-5 py-3 text-sm font-bold text-on-error shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Raise Dispute"}
          </button>
        </div>
      </form>
    </div>
  );
}
