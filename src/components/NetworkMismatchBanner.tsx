"use client";

import { AlertTriangle } from "lucide-react";
import { NETWORK_NAME } from "@/constants";
import { useWallet } from "@/context/WalletContext";

export default function NetworkMismatchBanner() {
  const { isConnected, networkMismatch } = useWallet();

  if (!isConnected || !networkMismatch) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[70] border-b border-error/30 bg-error-container px-4 py-3 text-on-error-container shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
        <div className="min-w-0">
          <p className="text-sm font-bold">Wallet network mismatch</p>
          <p className="mt-0.5 text-sm">
            Switch your wallet to {NETWORK_NAME} before signing transactions. The app stays available, but
            transaction actions may fail until the wallet network matches.
          </p>
        </div>
      </div>
    </div>
  );
}
