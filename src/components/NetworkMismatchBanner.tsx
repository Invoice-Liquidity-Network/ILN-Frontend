"use client";

import { AlertTriangle } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import {
  formatNetworkLabel,
  getConfiguredStellarNetwork,
} from "@/utils/network";

export default function NetworkMismatchBanner() {
  const { networkMismatch, isConnected, walletNetwork } = useWallet();

  if (!isConnected || !networkMismatch || !walletNetwork) {
    return null;
  }

  const appNetwork = getConfiguredStellarNetwork();

  return (
    <div
      role="alert"
      className="sticky top-0 z-[60] border-b border-error/30 bg-error-container/95 text-on-error-container backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden />
        <div>
          <p className="font-semibold">Network mismatch</p>
          <p className="mt-0.5 text-on-error-container/90">
            Your wallet is on {formatNetworkLabel(walletNetwork)}, but this app is
            configured for {formatNetworkLabel(appNetwork)}. Switch your wallet network
            to {formatNetworkLabel(appNetwork)} before signing transactions — they will
            fail on the wrong network.
          </p>
        </div>
      </div>
    </div>
  );
}
