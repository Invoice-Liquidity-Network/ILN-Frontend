"use client";

import React, { useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";

const TRANSACTION_STEPS = [
  "Preparing transaction",
  "Awaiting wallet confirmation",
  "Submitting to network",
  "Confirming",
] as const;

type ContractActionKind = "pay" | "cancel" | "claim";
type TransactionStatus = "idle" | "loading" | "success" | "error";

export default function ContractActions() {
  const { addToast, updateToast } = useToast();
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string>("");
  const [resultMessage, setResultMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const lastActionRef = useRef<{ action: ContractActionKind; title: string } | null>(null);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleAction = async (action: ContractActionKind, title: string) => {
    if (status === "loading") {
      return;
    }

    lastActionRef.current = { action, title };
    setStatus("loading");
    setActiveAction(action);
    setActiveStage(TRANSACTION_STEPS[0]);
    setResultMessage("");
    setErrorMessage("");

    const toastId = addToast({ type: "pending", title: `${title}...` });

    try {
      for (const step of TRANSACTION_STEPS) {
        setActiveStage(step);
        await delay(650);
      }

      if (Math.random() <= 0.1) {
        throw new Error("Transaction rejected by network");
      }

      const txHash = Math.random().toString(16).substring(2, 15);
      updateToast(toastId, {
        type: "success",
        title: `${title} Successful`,
        txHash,
      });
      setStatus("success");
      setResultMessage(`Transaction confirmed on-chain. Tx ${txHash.slice(0, 8)}...`);
      setErrorMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      updateToast(toastId, {
        type: "error",
        title: `${title} Failed`,
        message,
        action: {
          label: "Retry",
          onClick: () => {
            if (lastActionRef.current) {
              void handleAction(lastActionRef.current.action, lastActionRef.current.title);
            }
          },
        },
      });
      setStatus("error");
      setErrorMessage(message);
    }
  };

  return (
    <section className="bg-surface-container-lowest py-24 px-8 border-t border-outline-variant/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-headline mb-4">Protocol Interactions</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            Test the transaction feedback system by simulating different contract
            interactions available on the ILN protocol.
          </p>
        </div>

        {status !== "idle" && (
          <div
            role="status"
            aria-label="Transaction status"
            aria-live="polite"
            className="mb-10 rounded-3xl border border-outline-variant/15 bg-surface-container-low p-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  {status === "error"
                    ? "Transaction failed"
                    : status === "success"
                      ? "Transaction complete"
                      : "Transaction in progress"}
                </p>
                <h3 className="text-xl font-semibold text-on-surface">
                  {activeAction === "pay"
                    ? "Pay Invoice"
                    : activeAction === "cancel"
                      ? "Cancel Listing"
                      : "Claim Default"}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  {status === "error"
                    ? errorMessage
                    : status === "success"
                      ? resultMessage
                      : activeStage}
                </p>
              </div>

              {status === "error" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (lastActionRef.current) {
                      void handleAction(
                        lastActionRef.current.action,
                        lastActionRef.current.title,
                      );
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-surface-container-lowest transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Retry
                </button>
              ) : null}
            </div>

            {status === "loading" && (
              <div className="mt-5 space-y-3">
                <div className="h-2 overflow-hidden rounded-full bg-surface-variant">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        ((TRANSACTION_STEPS.indexOf(activeStage as (typeof TRANSACTION_STEPS)[number]) + 1) /
                          TRANSACTION_STEPS.length) *
                          100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
                  {TRANSACTION_STEPS.map((step) => (
                    <span
                      key={step}
                      className={`rounded-full px-3 py-1 transition-colors ${
                        step === activeStage
                          ? "bg-primary text-surface-container-lowest"
                          : "bg-surface-container-highest"
                      }`}
                    >
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="Pay Invoice"
            description="Simulate a payer settling an outstanding invoice with USDC."
            icon="payments"
            statusText={status === "loading" && activeAction === "pay" ? activeStage : undefined}
            isBusy={status === "loading"}
            onClick={() => handleAction("pay", "Paying Invoice")}
          />
          <ActionCard
            title="Cancel Listing"
            description="Freelancer cancelling an unfunded invoice listing from the network."
            icon="cancel"
            statusText={status === "loading" && activeAction === "cancel" ? activeStage : undefined}
            isBusy={status === "loading"}
            onClick={() => handleAction("cancel", "Cancelling Listing")}
          />
          <ActionCard
            title="Claim Default"
            description="LP claiming the underlying collateral or insurance after a manual default."
            icon="gavel"
            statusText={status === "loading" && activeAction === "claim" ? activeStage : undefined}
            isBusy={status === "loading"}
            onClick={() => handleAction("claim", "Claiming Default")}
          />
        </div>
      </div>
    </section>
  );
}

function ActionCard({
  title,
  description,
  icon,
  statusText,
  isBusy,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  statusText?: string;
  isBusy: boolean;
  onClick: () => void;
}) {
  return (
    <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all group">
      <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container mb-6 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
        {description}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={isBusy}
        aria-busy={isBusy}
        className="w-full py-3 px-6 rounded-lg bg-surface-container-highest font-bold text-sm hover:bg-primary hover:text-surface-container-lowest transition-colors active:scale-95 duration-150"
      >
        {statusText ?? "Simulate Transaction"}
      </button>
    </div>
  );
}
