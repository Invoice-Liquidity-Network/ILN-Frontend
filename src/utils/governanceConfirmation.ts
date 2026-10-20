/**
 * Governance Transaction Confirmation & Timeout Handler (#1045)
 *
 * Implements bounded confirmation polling that explicitly distinguishes:
 * - CONFIRMED: Successfully validated in a ledger
 * - TIMEOUT: Polling budget expired before confirmation (potential in-flight tx)
 * - FAILED: Transaction explicitly failed during execution (reverted on-chain)
 * - REJECTED: Transaction rejected before submission (signature declined or simulation failed)
 */

export type GovernanceTxStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'TIMEOUT'
  | 'FAILED'
  | 'REJECTED';

export class GovernanceTxTimeoutError extends Error {
  readonly code = 'TRANSACTION_TIMEOUT';
  constructor(
    message: string,
    public readonly txHash: string,
    public readonly elapsedMs: number,
    public readonly timeoutMs: number,
  ) {
    super(`[TRANSACTION_TIMEOUT] ${message}`);
    this.name = 'GovernanceTxTimeoutError';
  }
}

export class GovernanceTxFailedError extends Error {
  readonly code = 'TRANSACTION_FAILED';
  constructor(
    message: string,
    public readonly txHash: string,
    public readonly reason?: string,
  ) {
    super(`[TRANSACTION_FAILED] ${message}`);
    this.name = 'GovernanceTxFailedError';
  }
}

export interface PollingOptions {
  /** Maximum time to wait for confirmation in milliseconds (default 30,000ms = 30s) */
  timeoutMs?: number;
  /** Polling interval in milliseconds (default 2,000ms = 2s) */
  intervalMs?: number;
  /** Custom clock for deterministic testing */
  now?: () => number;
}

export interface PollResult {
  status: GovernanceTxStatus;
  txHash: string;
  ledger?: number;
  error?: string;
  elapsedMs: number;
}

export interface TxStatusCheckResponse {
  confirmed: boolean;
  failed?: boolean;
  error?: string;
  ledger?: number;
}

export async function pollGovernanceConfirmation(
  txHash: string,
  checkStatus: (hash: string) => Promise<TxStatusCheckResponse>,
  options: PollingOptions = {},
): Promise<PollResult> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const intervalMs = options.intervalMs ?? 2_000;
  let simulatedTime = options.now ? options.now() : Date.now();
  const startTime = simulatedTime;

  while (true) {
    const elapsed = (options.now ? options.now() : Date.now()) - startTime;

    if (elapsed >= timeoutMs) {
      return {
        status: 'TIMEOUT',
        txHash,
        elapsedMs: elapsed,
        error: `Confirmation polling exceeded bounded limit of ${timeoutMs}ms without definitive on-chain inclusion. Transaction may still settle.`,
      };
    }

    try {
      const result = await checkStatus(txHash);
      if (result.confirmed) {
        return {
          status: 'CONFIRMED',
          txHash,
          ledger: result.ledger,
          elapsedMs: elapsed,
        };
      }
      if (result.failed) {
        return {
          status: 'FAILED',
          txHash,
          error: result.error ?? 'Transaction execution reverted on-chain',
          elapsedMs: elapsed,
        };
      }
    } catch {
      // Transient error in checkStatus; continue polling until deadline
    }

    // Wait for next polling tick
    await new Promise((resolve) => setTimeout(resolve, Math.min(intervalMs, 50)));
    if (options.now) {
      // Fast forward custom clock for testing
      simulatedTime += intervalMs;
    }
  }
}
