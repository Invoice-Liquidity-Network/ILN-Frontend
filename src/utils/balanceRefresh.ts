export const WALLET_BALANCES_REFRESH_EVENT = "iln:wallet-balances-refresh";

export function notifyWalletBalancesChanged() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(WALLET_BALANCES_REFRESH_EVENT));
}
