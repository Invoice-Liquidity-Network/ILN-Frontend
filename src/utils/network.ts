import { STELLAR_NETWORK } from "@/constants";

/** Normalize Freighter / wallet network strings to `testnet` | `mainnet`. */
export function normalizeWalletNetwork(network: string): string {
  const value = network.trim().toUpperCase();
  if (value === "PUBLIC" || value === "MAINNET" || value === "MAIN") {
    return "mainnet";
  }
  if (value === "TESTNET" || value === "TEST" || value === "FUTURENET") {
    return "testnet";
  }
  return network.trim().toLowerCase();
}

export function getConfiguredStellarNetwork(): string {
  return STELLAR_NETWORK.trim().toLowerCase();
}

export function networksMatch(walletNetwork: string, appNetwork = getConfiguredStellarNetwork()): boolean {
  return normalizeWalletNetwork(walletNetwork) === appNetwork.toLowerCase();
}

export function formatNetworkLabel(network: string): string {
  const normalized = normalizeWalletNetwork(network);
  return normalized === "mainnet" ? "Mainnet" : "Testnet";
}
