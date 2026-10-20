/**
 * Governance Source & Freshness Metadata (#1058)
 *
 * Captures authoritative ledger sequence, Unix timestamp, and explicit read failure
 * state for Soroban governance contract interactions.
 */

export interface GovernanceMetadata {
  /** Authoritative ledger sequence number returned by Soroban RPC */
  ledgerSequence: number;
  /** Unix timestamp in milliseconds when the state was fetched */
  timestamp: number;
  /** ISO date string for user-facing and audit logging */
  freshnessIso: string;
  /** Source identifier (e.g. 'soroban-rpc' or 'dev-mock') */
  source: 'soroban-rpc' | 'dev-mock';
  /** Whether the data age exceeds normal freshness budget (>15 mins) */
  isStale: boolean;
}

export interface GovernanceDataEnvelope<T> {
  data: T;
  metadata: GovernanceMetadata;
}

export interface GovernanceReadFailureState {
  hasError: boolean;
  errorName?: string;
  errorMessage?: string;
  lastKnownLedger?: number;
  lastKnownTimestamp?: number;
}

const GOVERNANCE_STALENESS_THRESHOLD_MS = 15 * 60 * 1000;

export function createGovernanceMetadata(
  ledgerSequence: number,
  timestamp: number = Date.now(),
  source: 'soroban-rpc' | 'dev-mock' = 'soroban-rpc',
  now: number = Date.now(),
): GovernanceMetadata {
  const isStale = now - timestamp > GOVERNANCE_STALENESS_THRESHOLD_MS;
  return {
    ledgerSequence,
    timestamp,
    freshnessIso: new Date(timestamp).toISOString(),
    source,
    isStale,
  };
}

export function formatGovernanceLedgerLabel(metadata: GovernanceMetadata): string {
  return `Ledger #${metadata.ledgerSequence.toLocaleString()}`;
}

export function formatGovernanceFreshnessAge(
  timestamp: number,
  now: number = Date.now(),
): string {
  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  return `${elapsedHours}h ago`;
}
