import { STELLAR_NETWORK, RPC_URL, NETWORK_NAME } from '@/constants';

/**
 * Canonical Stellar network identifiers supported by the ILN application.
 *
 * Assumptions & data sources:
 * - Wallet extensions (Freighter, WalletConnect CAIP-2, etc.) may report
 *   short names (`PUBLIC`, `TESTNET`), aliases (`MAINNET`, `PUBNET`, `TEST`),
 *   CAIP-2 IDs (`stellar:pubnet`, `stellar:testnet`), or full Stellar network
 *   passphrases.
 * - `FUTURENET` is intentionally NOT aliased to `testnet` because Futurenet
 *   has a separate ledger, passphrase, and contract deployments; treating it as
 *   `testnet` would suppress mismatch warnings and allow wrong-network signing.
 *
 * Failure behavior:
 * - Empty, whitespace-only, or non-string values normalize to `'unknown'`.
 * - Unrecognized non-empty values are lowercased and preserved for diagnostics,
 *   but `networksMatch` and `getMismatchDetails` fail closed (`false` /
 *   `walletMismatch: true`) unless both sides resolve to `'mainnet'` or
 *   `'testnet'`.
 * - Residual risk: `getRpcNetworkFromUrl` returns `null` for custom/private
 *   RPC URLs, so `checkRpcMismatch` cannot detect mismatches on custom RPCs.
 */
const SUPPORTED_APP_NETWORKS = new Set(['mainnet', 'testnet']);

/** Normalize wallet network strings, CAIP-2 IDs, and passphrases to canonical labels. */
export function normalizeWalletNetwork(network: string): string {
  if (typeof network !== 'string') return 'unknown';
  const trimmed = network.trim();
  if (!trimmed) return 'unknown';

  const value = trimmed.toUpperCase();
  if (
    value === 'PUBLIC' ||
    value === 'PUBNET' ||
    value === 'MAINNET' ||
    value === 'MAIN' ||
    value === 'STELLAR:PUBNET' ||
    value === 'PUBLIC GLOBAL STELLAR NETWORK ; SEPTEMBER 2015'
  ) {
    return 'mainnet';
  }
  if (
    value === 'TESTNET' ||
    value === 'TEST' ||
    value === 'STELLAR:TESTNET' ||
    value === 'TEST SDF NETWORK ; SEPTEMBER 2015'
  ) {
    return 'testnet';
  }
  if (
    value === 'FUTURENET' ||
    value === 'STELLAR:FUTURENET' ||
    value === 'TEST SDF FUTURE NETWORK ; OCTOBER 2022'
  ) {
    return 'futurenet';
  }
  return trimmed.toLowerCase();
}

export function getConfiguredStellarNetwork(): string {
  return normalizeWalletNetwork(STELLAR_NETWORK);
}

export function networksMatch(
  walletNetwork: string,
  appNetwork = getConfiguredStellarNetwork()
): boolean {
  const normalizedWallet = normalizeWalletNetwork(walletNetwork);
  const normalizedApp = normalizeWalletNetwork(appNetwork);
  if (!SUPPORTED_APP_NETWORKS.has(normalizedWallet) || !SUPPORTED_APP_NETWORKS.has(normalizedApp)) {
    return false;
  }
  return normalizedWallet === normalizedApp;
}

export function formatNetworkLabel(network: string): string {
  const normalized = normalizeWalletNetwork(network);
  if (normalized === 'mainnet') return 'Mainnet';
  if (normalized === 'testnet') return 'Testnet';
  if (normalized === 'futurenet') return 'Futurenet';
  return 'Unknown';
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
    walletMismatch: !networksMatch(normalizedWallet, appNetwork),
    rpcMismatch: checkRpcMismatch(RPC_URL, walletNetwork),
    walletNetwork: normalizedWallet,
    appNetwork,
    rpcUrl: RPC_URL,
    rpcNetwork,
    appNetworkName: NETWORK_NAME,
  };
}
