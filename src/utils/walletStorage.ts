/**
 * Wallet session storage cleanup (#4).
 *
 * On disconnect we must drop every trace of the previous session: the stored
 * address plus any wallet-scoped caches (address book, watchlist, referral
 * attribution, cached invoice/portfolio data). Centralised here so disconnect
 * has a single, testable definition of "what counts as session data".
 */

export const WALLET_ADDRESS_STORAGE_KEY = "iln_wallet_address";

/** Prefixes/keys considered user-session data, removed on disconnect. */
export const WALLET_SCOPED_PREFIXES = [
  "iln-address-book-",
  "iln-watchlist",
  "iln-referral-",
  "iln-invoices-",
  "iln-portfolio-",
  "freelancerInvoices",
];

export function clearWalletStorage(storage: Storage = window.localStorage): void {
  storage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && WALLET_SCOPED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => storage.removeItem(key));
}
