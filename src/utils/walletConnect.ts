"use client";

import { NETWORK_NAME, NETWORK_PASSPHRASE } from "@/constants";

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const APP_METADATA = {
  name: "Invoice Liquidity Network",
  description: "Invoice Liquidity Network wallet connection",
  url: "https://invoice-liquidity-network.vercel.app",
  icons: ["https://invoice-liquidity-network.vercel.app/favicon.ico"],
};

let kitReady = false;

function getErrorMessage(error: unknown, fallback = "WalletConnect request failed") {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function isTestnet() {
  return NETWORK_PASSPHRASE.toLowerCase().includes("test sdf") || NETWORK_NAME.toUpperCase() === "TESTNET";
}

async function initializeWalletConnectKit() {
  if (!WALLETCONNECT_PROJECT_ID) {
    throw new Error("WalletConnect is not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to enable pairing.");
  }

  const [
    { StellarWalletsKit, Networks },
    { FreighterModule },
    { WalletConnectModule, WalletConnectTargetChain },
  ] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit"),
    import("@creit.tech/stellar-wallets-kit/modules/freighter"),
    import("@creit.tech/stellar-wallets-kit/modules/wallet-connect"),
  ]);

  if (!kitReady) {
    const targetChain = isTestnet() ? WalletConnectTargetChain.TESTNET : WalletConnectTargetChain.PUBLIC;

    StellarWalletsKit.init({
      modules: [
        new FreighterModule(),
        new WalletConnectModule({
          projectId: WALLETCONNECT_PROJECT_ID,
          metadata: APP_METADATA,
          allowedChains: [targetChain],
        }),
      ],
      network: isTestnet() ? Networks.TESTNET : Networks.PUBLIC,
    });
    kitReady = true;
  }

  return StellarWalletsKit;
}

export function isWalletConnectConfigured() {
  return Boolean(WALLETCONNECT_PROJECT_ID);
}

export async function connectWalletConnect() {
  try {
    const [{ WALLET_CONNECT_ID }, kit] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/modules/wallet-connect"),
      initializeWalletConnectKit(),
    ]);
    kit.setWallet(WALLET_CONNECT_ID);
    return await kit.fetchAddress();
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function signWalletConnectTransaction(txXdr: string, address: string) {
  try {
    const [{ WALLET_CONNECT_ID }, kit] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/modules/wallet-connect"),
      initializeWalletConnectKit(),
    ]);
    kit.setWallet(WALLET_CONNECT_ID);
    const { signedTxXdr } = await kit.signTransaction(txXdr, {
      address,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    return signedTxXdr;
  } catch (error) {
    throw new Error(getErrorMessage(error, "WalletConnect session expired. Reconnect your wallet and try again."));
  }
}

export async function disconnectWalletConnect() {
  try {
    const [{ WALLET_CONNECT_ID }, kit] = await Promise.all([
      import("@creit.tech/stellar-wallets-kit/modules/wallet-connect"),
      initializeWalletConnectKit(),
    ]);
    kit.setWallet(WALLET_CONNECT_ID);
    await kit.disconnect();
  } catch (error) {
    if (getErrorMessage(error).includes("not configured")) {
      return;
    }
    throw error;
  }
}
