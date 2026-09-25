import { STELLAR_NETWORK, RPC_URL, NETWORK_NAME } from '@/constants';

/** Normalize Freighter / wallet network strings to `testnet` | `mainnet`. */
export function normalizeWalletNetwork(network: string): string {
  const value = network.trim().toUpperCase();
  if (value === 'PUBLIC' || value === 'MAINNET' || value === 'MAIN') {
    return 'mainnet';
  }
  if (value === 'TESTNET' || value === 'TEST' || value === 'FUTURENET') {
    return 'testnet';
  }
  return network.trim().toLowerCase();
}

export function getConfiguredStellarNetwork(): string {
  return STELLAR_NETWORK.trim().toLowerCase();
}

export function networksMatch(
  walletNetwork: string,
  appNetwork = getConfiguredStellarNetwork()
): boolean {
  return normalizeWalletNetwork(walletNetwork) === appNetwork.toLowerCase();
}

export function formatNetworkLabel(network: string): string {
  const normalized = normalizeWalletNetwork(network);
  return normalized === 'mainnet' ? 'Mainnet' : 'Testnet';
}

/**
 * Known Soroban RPC URLs grouped by network.
 */
const KNOWN_RPC_URLS: Record<string, RegExp[]> = {
  testnet: [/soroban-testnet\.stellar\.org/i, /rpc-testnet\.stellar\.org/i, /testnet\.soroban/i],
  mainnet: [
    /soroban\.stellar\.org/i,
    /rpc\.stellar\.org/i,
    /mainnet\.soroban/i,
    /soroban-mainnet\.stellar\.org/i,
  ],
};

/**
 * Determine which network an RPC URL belongs to based on known patterns.
 * Returns `"testnet"`, `"mainnet"`, or `null` if unknown/custom.
 */
export function getRpcNetworkFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  for (const [network, patterns] of Object.entries(KNOWN_RPC_URLS)) {
    if (patterns.some((p) => p.test(trimmed))) {
      return network;
    }
  }

  return null;
}

/**
 * Check if the given RPC URL matches the expected network for the wallet.
 * Returns `true` if there IS a mismatch (i.e., RPC URL network != wallet network).
 */
export function checkRpcMismatch(rpcUrl: string, walletNetwork: string): boolean {
  const rpcNetwork = getRpcNetworkFromUrl(rpcUrl);
  if (!rpcNetwork) return false; // custom RPC, can't determine
  return rpcNetwork !== normalizeWalletNetwork(walletNetwork);
}

export interface MismatchDetails {
  /** Whether the wallet network differs from the app network. */
  walletMismatch: boolean;
  /** Whether the configured RPC URL belongs to a different network. */
  rpcMismatch: boolean;
  /** Normalized wallet network label (`"mainnet"` | `"testnet"`). */
  walletNetwork: string;
  /** App-configured network label. */
  appNetwork: string;
  /** The configured RPC URL. */
  rpcUrl: string;
  /** Detected network of the RPC URL, if known. */
  rpcNetwork: string | null;
  /** App-configured NETWORK_NAME. */
  appNetworkName: string;
}

/**
 * Get structured mismatch details by comparing the wallet's reported network
 * against the app's configured network and RPC URL.
 */
export function getMismatchDetails(walletNetwork: string): MismatchDetails {
  const appNetwork = getConfiguredStellarNetwork();
  const normalizedWallet = normalizeWalletNetwork(walletNetwork);
  const rpcNetwork = getRpcNetworkFromUrl(RPC_URL);

  return {
    walletMismatch: normalizedWallet !== appNetwork,
    rpcMismatch: checkRpcMismatch(RPC_URL, walletNetwork),
    walletNetwork: normalizedWallet,
    appNetwork,
    rpcUrl: RPC_URL,
    rpcNetwork,
    appNetworkName: NETWORK_NAME,
  };
}
