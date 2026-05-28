"use client";

/**
 * WalletConnect v2 connector scaffold (#2).
 *
 * The wallet layer is provider-agnostic: callers go through `WalletContext` and
 * never need to know whether Freighter or WalletConnect is active. This module
 * is the WalletConnect side of that abstraction.
 *
 * Live pairing requires a WalletConnect project id (relay credentials) plus the
 * `@walletconnect/sign-client` SDK. To keep the build honest and self-contained,
 * this scaffold gates the flow on `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`:
 *   - unconfigured → the option is surfaced as unavailable, never a fake success;
 *   - configured   → a pairing URI is produced for QR display.
 * Wiring the real sign-client session is intentionally left as a follow-up.
 */

export class WalletConnectUnavailableError extends Error {
  constructor(
    message = "WalletConnect is not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to enable it.",
  ) {
    super(message);
    this.name = "WalletConnectUnavailableError";
  }
}

/** Read at call time so configuration is picked up at runtime (and in tests). */
export function walletConnectProjectId(): string {
  return (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "").trim();
}

export function isWalletConnectConfigured(): boolean {
  return walletConnectProjectId().length > 0;
}

/**
 * Pairing URI to render as a QR code. Returns a deterministic placeholder when
 * configured; throws {@link WalletConnectUnavailableError} when not, so the UI
 * can present an honest "unavailable" state instead of a dead QR.
 */
export function getWalletConnectPairingUri(): string {
  const id = walletConnectProjectId();
  if (!id) {
    throw new WalletConnectUnavailableError();
  }
  return `wc:${id}@2?relay-protocol=irn`;
}
