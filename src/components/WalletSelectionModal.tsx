"use client";

import type { WalletProviderId } from "@/context/WalletContext";

interface WalletSelectionModalProps {
  isOpen: boolean;
  walletConnectConfigured: boolean;
  onClose: () => void;
  onSelect: (provider: WalletProviderId) => void;
}

export default function WalletSelectionModal({
  isOpen,
  walletConnectConfigured,
  onClose,
  onSelect,
}: WalletSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-selection-title"
        className="w-full max-w-md rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="wallet-selection-title" className="text-lg font-bold text-on-surface">
              Connect wallet
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Choose how you want to sign ILN transactions.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close wallet selection"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            aria-label="Freighter"
            onClick={() => onSelect("freighter")}
            className="flex w-full items-center gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-primary">
              extension
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-on-surface">Freighter</span>
              <span className="block text-sm text-on-surface-variant">Browser extension wallet</span>
            </span>
          </button>

          <button
            type="button"
            aria-label="WalletConnect"
            onClick={() => onSelect("walletconnect")}
            disabled={!walletConnectConfigured}
            className="flex w-full items-center gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span className="material-symbols-outlined rounded-full bg-primary/10 p-2 text-primary">
              qr_code_2
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-on-surface">WalletConnect</span>
              <span className="block text-sm text-on-surface-variant">
                Pair a mobile or hardware wallet with a QR code.
              </span>
            </span>
          </button>
        </div>

        {!walletConnectConfigured && (
          <p className="mt-4 rounded-lg border border-outline-variant/20 bg-surface-container-low p-3 text-xs text-on-surface-variant">
            WalletConnect needs `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` before QR pairing can be used.
          </p>
        )}
      </div>
    </div>
  );
}
