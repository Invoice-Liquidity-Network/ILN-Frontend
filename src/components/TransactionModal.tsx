"use client";

import type { TransactionPhase } from "@/hooks/useTransaction";

interface TransactionModalProps {
  phase: TransactionPhase;
  error?: string | null;
}

export default function TransactionModal({ phase, error }: TransactionModalProps) {
  if (phase === "idle" || phase === "success" || phase === "error") {
    return null;
  }

  const title = "Waiting for wallet signature...";
  const message = error ?? "Confirm the request in your Stellar wallet to continue.";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-center shadow-2xl">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <h2 className="mt-5 text-lg font-bold text-on-surface">{title}</h2>
        <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
      </div>
    </div>
  );
}
