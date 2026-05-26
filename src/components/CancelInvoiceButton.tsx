"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useWallet } from "@/context/WalletContext";
import { cancelInvoice, submitSignedTransaction } from "@/utils/soroban";

interface CancelInvoiceButtonProps {
  invoiceId: bigint;
  freelancer: string;
  status: string;
  onCancelled: () => void;
  className?: string;
}

export default function CancelInvoiceButton({
  invoiceId,
  freelancer,
  status,
  onCancelled,
  className = "",
}: CancelInvoiceButtonProps) {
  const { address, signTx } = useWallet();
  const { addToast, updateToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isSubmitter = address === freelancer;
  const canCancel = isSubmitter && status === "Pending";

  if (!canCancel) return null;

  const handleCancel = async () => {
    setIsCancelling(true);
    const toastId = addToast({
      type: "pending",
      title: "Cancelling invoice...",
      message: "Please sign the cancellation transaction.",
    });

    try {
      const { tx } = await cancelInvoice(freelancer, invoiceId);
      const { txHash } = await submitSignedTransaction({ tx, signTx });
      onCancelled();
      setIsOpen(false);
      updateToast(toastId, {
        type: "success",
        title: "Invoice Cancelled",
        message: `Invoice #${invoiceId.toString()} was cancelled.`,
        txHash,
      });
    } catch (error) {
      updateToast(toastId, {
        type: "error",
        title: "Cancellation Failed",
        message: error instanceof Error ? error.message : "Unable to cancel this invoice.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-error/30 px-3 py-2 text-sm font-bold text-error transition-colors hover:bg-error-container ${className}`}
      >
        <span className="material-symbols-outlined text-[17px]">cancel</span>
        Cancel Invoice
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-invoice-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-3xl text-error">warning</span>
              <div>
                <h2 id="cancel-invoice-title" className="text-xl font-bold text-on-surface">
                  Cancel Invoice #{invoiceId.toString()}
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Are you sure? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isCancelling}
                className="rounded-lg border border-outline-variant/20 px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
              >
                Keep Invoice
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-bold text-on-error transition-colors hover:bg-error/90 disabled:opacity-50"
              >
                {isCancelling && (
                  <span className="h-4 w-4 rounded-full border-2 border-on-error border-t-transparent animate-spin" />
                )}
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
