"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  isWalletConnectConfigured,
  getWalletConnectPairingUri,
} from "@/lib/walletConnect";

interface WalletSelectionModalProps {
  onClose: () => void;
  /** Connect via the Freighter browser extension. */
  onSelectFreighter: () => void;
}

/**
 * Wallet selection modal (#2): lets the user choose between Freighter and
 * WalletConnect. Freighter connects immediately; WalletConnect shows a pairing
 * QR when configured, or an honest "unavailable" state otherwise.
 */
export default function WalletSelectionModal({
  onClose,
  onSelectFreighter,
}: WalletSelectionModalProps) {
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const walletConnectReady = isWalletConnectConfigured();
  const pairingUri = walletConnectReady ? safePairingUri() : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select a wallet"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <h2 className="text-xl font-bold">Connect a wallet</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-variant/50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!showWalletConnect ? (
          <div className="space-y-3 p-6">
            <button
              type="button"
              onClick={onSelectFreighter}
              className="flex w-full items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container px-4 py-4 text-left font-bold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">extension</span>
                Freighter
              </span>
              <span className="text-xs font-medium text-on-surface-variant">Browser extension</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWalletConnect(true)}
              disabled={!walletConnectReady}
              className="flex w-full items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container px-4 py-4 text-left font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">qr_code_2</span>
                WalletConnect
              </span>
              <span className="text-xs font-medium text-on-surface-variant">Mobile &amp; hardware</span>
            </button>

            {!walletConnectReady ? (
              <p className="rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
                WalletConnect is not configured in this environment. Set
                <code className="mx-1">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</code>
                to enable mobile and hardware-wallet pairing.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-6">
            <p className="text-sm font-bold text-on-surface">Scan with a WalletConnect wallet</p>
            {pairingUri ? (
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={pairingUri} size={180} />
              </div>
            ) : null}
            <p className="text-center text-xs text-on-surface-variant">
              Open your mobile wallet and scan this code to pair. Session completion
              requires the WalletConnect relay.
            </p>
            <button
              type="button"
              onClick={() => setShowWalletConnect(false)}
              className="text-sm font-bold text-primary hover:underline"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function safePairingUri(): string | null {
  try {
    return getWalletConnectPairingUri();
  } catch {
    return null;
  }
}
