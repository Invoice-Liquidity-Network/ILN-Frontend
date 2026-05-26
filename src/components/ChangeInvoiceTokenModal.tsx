"use client";

import { useMemo, useState } from "react";
import TokenSelector, { TokenIcon } from "@/components/TokenSelector";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useTransaction } from "@/hooks/useTransaction";
import { useToast } from "@/context/ToastContext";
import {
  buildConvertInvoiceTokenTransaction,
  type Invoice,
  type TokenMetadata,
} from "@/utils/soroban";

function toIconLabel(symbol: string): string {
  return symbol.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "TK";
}

function tokenFromInvoice(invoice: Invoice): TokenMetadata & { iconLabel: string } {
  return {
    contractId: invoice.token ?? "",
    name: invoice.token ? "Current token" : "Default token",
    symbol: invoice.token ? "TOKEN" : "USDC",
    decimals: 7,
    iconLabel: invoice.token ? "TK" : "US",
  };
}

export default function ChangeInvoiceTokenModal({
  invoice,
  submitter,
  onClose,
  onSuccess,
}: {
  invoice: Invoice;
  submitter: string;
  onClose: () => void;
  onSuccess: (newToken: string) => void;
}) {
  const { tokens, tokenMap, defaultToken, isLoading, error } = useApprovedTokens();
  const { addToast, updateToast } = useToast();
  const { isPending, runTransaction } = useTransaction();
  const currentTokenId = invoice.token ?? defaultToken?.contractId ?? "";
  const currentToken = tokenMap.get(currentTokenId) ?? defaultToken ?? tokenFromInvoice(invoice);
  const availableTokens = useMemo(
    () => tokens.filter((token) => token.contractId !== currentTokenId),
    [currentTokenId, tokens]
  );
  const [newToken, setNewToken] = useState("");
  const selectedTokenId = newToken || availableTokens[0]?.contractId || "";
  const selectedToken = tokenMap.get(selectedTokenId);
  const canSubmit = Boolean(selectedTokenId) && selectedTokenId !== currentTokenId && !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const toastId = addToast({
      type: "pending",
      title: "Changing invoice token...",
      message: "This changes the currency your invoice is denominated in.",
    });

    try {
      const { txHash } = await runTransaction(() =>
        buildConvertInvoiceTokenTransaction({
          submitter,
          invoiceId: invoice.id,
          newToken: selectedTokenId,
        })
      );
      updateToast(toastId, {
        type: "success",
        title: "Invoice token changed",
        message: selectedToken
          ? `Invoice is now denominated in ${selectedToken.symbol}.`
          : "Invoice token updated.",
        txHash,
      });
      onSuccess(selectedTokenId);
      onClose();
    } catch (conversionError) {
      updateToast(toastId, {
        type: "error",
        title: "Token change failed",
        message: conversionError instanceof Error ? conversionError.message : "Unable to change invoice token.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <section className="w-full max-w-lg rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Pending invoice</p>
            <h2 className="mt-1 text-2xl font-bold text-on-surface">Change Token</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-variant"
            aria-label="Close token change modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          This changes the currency your invoice is denominated in.
        </div>

        <div className="mb-5 rounded-2xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Current token
          </p>
          <div className="flex items-center gap-3">
            <TokenIcon token={{ iconLabel: toIconLabel(currentToken.symbol), symbol: currentToken.symbol }} />
            <div>
              <p className="text-sm font-bold text-on-surface">{currentToken.symbol}</p>
              <p className="break-all text-xs text-on-surface-variant">{currentToken.contractId || "Default token"}</p>
            </div>
          </div>
        </div>

        <TokenSelector
          label="New token"
          value={selectedTokenId}
          tokens={availableTokens}
          onChange={setNewToken}
          disabled={isLoading || isPending || availableTokens.length === 0}
          error={error || undefined}
          hint={
            availableTokens.length === 0
              ? "No alternate allowlisted tokens are available."
              : "Only allowlisted protocol tokens can be selected."
          }
        />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-outline-variant/25 px-5 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Changing..." : "Change Token"}
          </button>
        </div>
      </section>
    </div>
  );
}
