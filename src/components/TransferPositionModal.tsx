"use client";

import { FormEvent, useMemo, useState } from "react";
import { formatAddress, formatUSDC } from "@/utils/format";
import { isValidStellarAccount } from "@/utils/invoiceSubmission";
import type { Invoice } from "@/utils/soroban";

interface TransferPositionModalProps {
  invoice: Invoice | null;
  currentLpAddress: string | null;
  isTransferring: boolean;
  error?: string | null;
  onClose: () => void;
  onTransfer: (newLpAddress: string) => Promise<void> | void;
}

export default function TransferPositionModal({
  invoice,
  currentLpAddress,
  isTransferring,
  error,
  onClose,
  onTransfer,
}: TransferPositionModalProps) {
  const [newLpAddress, setNewLpAddress] = useState("");
  const trimmedAddress = newLpAddress.trim();

  const validationMessage = useMemo(() => {
    if (!trimmedAddress) return "Enter the new LP address.";
    if (!isValidStellarAccount(trimmedAddress)) return "Enter a valid Stellar G-address.";
    if (currentLpAddress && trimmedAddress === currentLpAddress) {
      return "New LP address must be different from the current LP.";
    }
    return null;
  }, [currentLpAddress, trimmedAddress]);

  if (!invoice) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) return;
    await onTransfer(trimmedAddress);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-position-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              LP Position
            </p>
            <h2 id="transfer-position-title" className="mt-1 text-2xl font-headline">
              Transfer Position
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high"
            aria-label="Close transfer position modal"
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
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-on-surface-variant">Current LP</span>
            <span className="font-mono text-xs">
              {formatAddress(currentLpAddress ?? invoice.funder ?? "")}
            </span>
          </div>
        </div>

        <label className="mt-5 block text-sm font-semibold" htmlFor="new-lp-address">
          New LP address
        </label>
        <input
          id="new-lp-address"
          value={newLpAddress}
          onChange={(event) => setNewLpAddress(event.target.value)}
          className="mt-2 w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-primary"
          placeholder="G..."
          aria-describedby="transfer-position-validation transfer-position-warning"
        />
        <p id="transfer-position-validation" className="mt-2 min-h-5 text-sm text-error">
          {trimmedAddress && validationMessage ? validationMessage : error}
        </p>

        <div
          id="transfer-position-warning"
          className="mt-4 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500"
        >
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <p>After transfer, all future payouts for this invoice go to the new address.</p>
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
            disabled={Boolean(validationMessage) || isTransferring}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isTransferring ? "Transferring..." : "Transfer Position"}
          </button>
        </div>
      </form>
    </div>
  );
}
