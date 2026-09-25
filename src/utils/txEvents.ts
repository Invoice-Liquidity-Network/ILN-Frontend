/**
 * Lightweight client-side signal fired after a successful on-chain transaction.
 *
 * Hooks that display chain-derived state (e.g. wallet balances) listen for this
 * event so they can refetch immediately instead of waiting for the next poll.
 * Kept in its own module so producers (`useTransaction`, the submit flow) and
 * consumers (`useBalances`) can share the contract without importing each other.
 */
export const TX_SUCCESS_EVENT = 'iln:tx-success';

/** Notify listeners that a transaction settled successfully. No-op on the server. */
export function notifyTxSuccess(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TX_SUCCESS_EVENT));
  }
}
