"use client";

import { useMemo } from "react";
import { useApprovedTokens } from "@/hooks/useApprovedTokens";
import { useBalances } from "@/hooks/useBalances";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import { useWallet } from "@/context/WalletContext";
import { TokenIcon } from "./TokenSelector";
import { formatAddress, formatTokenAmount } from "@/utils/format";
import { NETWORK_NAME } from "@/constants";
import { getTokenBalance } from "@/utils/soroban";
import TestnetFaucetButton from "./TestnetFaucetButton";

const FALLBACK_BALANCE_TOKENS: ApprovedToken[] = [
  {
    contractId: TESTNET_USDC_TOKEN_ID,
    decimals: 7,
    iconLabel: "US",
    isAllowed: true,
    logo: "/tokens/usdc.svg",
    name: "USD Coin",
    symbol: "USDC",
  },
  {
    contractId: TESTNET_EURC_TOKEN_ID,
    decimals: 7,
    iconLabel: "EU",
    isAllowed: true,
    logo: "/tokens/eurc.svg",
    name: "Euro Coin",
    symbol: "EURC",
  },
  {
    contractId: TESTNET_XLM_TOKEN_ID,
    decimals: 7,
    iconLabel: "XL",
    isAllowed: true,
    logo: "/tokens/xlm.svg",
    name: "Stellar Lumens",
    symbol: "XLM",
  },
];

function formatWalletBalance(amount: bigint, token: ApprovedToken) {
  return formatTokenAmount(amount, token)
    .replace(/(\.\d*?[1-9])0+(\s+\S+)$/, "$1$2")
    .replace(/\.0+(\s+\S+)$/, "$1");
}

export default function WalletButton() {
  const { address, isConnected, isInstalled, connect, disconnect, networkMismatch, error } = useWallet();
  const { tokens } = useApprovedTokens();
  const allowedTokens = useMemo(() => tokens.filter((token) => token.isAllowed), [tokens]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — nothing actionable to surface.
    }
  };

    return FALLBACK_BALANCE_TOKENS.map((fallback) => approvedBySymbol.get(fallback.symbol) ?? fallback);
  }, [tokens]);
  const { balances, isLoading: isLoadingBalances } = useBalances({
    address,
    enabled: isConnected && !networkMismatch,
    tokens: balanceTokens,
  });

  if (isConnected) {
    return (
      <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${networkMismatch ? 'bg-error animate-pulse' : 'bg-green-500'}`}></span>
            <span className={`text-[10px] font-bold uppercase ${networkMismatch ? 'text-error' : 'text-primary'}`}>
              {networkMismatch ? "Wrong Network" : NETWORK_NAME}
            </span>
          </div>
          {!networkMismatch ? (
            <div
              className="grid min-w-[230px] gap-1.5 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-2 shadow-sm"
              aria-label="Wallet token balances"
            >
              {balances.map((balance) => (
                <div
                  key={balance.contractId}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest px-2.5 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <TokenIcon token={balance.token} className="h-6 w-6 text-[9px]" />
                    <span className="text-xs font-bold text-on-surface">{balance.token.symbol}</span>
                  </span>
                  {isLoadingBalances && balance.isLoading ? (
                    <span
                      className="h-3 w-20 animate-pulse rounded-full bg-outline-variant/25"
                      aria-label={`${balance.token.symbol} balance loading`}
                    />
                  ) : (
                    <span className="flex flex-col items-end">
                      <span className="text-xs font-bold text-on-surface">
                        {formatWalletBalance(balance.amount, balance.token)}
                      </span>
                      {!balance.hasTrustline ? (
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                          Add Trustline
                        </span>
                      ) : null}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-on-surface-variant">{formatAddress(address!)}</span>
            <button
              type="button"
              onClick={() => void handleCopyAddress()}
              aria-label="Copy wallet address"
              title={copied ? "Copied!" : "Copy address"}
              className="flex h-5 w-5 items-center justify-center rounded text-on-surface-variant hover:bg-surface-variant/50"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? "check" : "content_copy"}
              </span>
            </button>
          </div>
          <TestnetFaucetButton />
        </div>
        <button
          onClick={disconnect}
          className="bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg text-sm font-bold hover:bg-surface-dim transition-all active:scale-95 border border-outline-variant/10"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={connect}
        className="bg-primary text-surface-container-lowest px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95 duration-150 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
        Connect Wallet
      </button>
      {!isInstalled && (
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block text-right text-[11px] font-medium text-primary hover:underline"
        >
          Don&apos;t have Freighter? Install it →
        </a>
      )}
      {error && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-error-container text-on-error-container text-xs rounded-lg shadow-xl border border-error/10 w-64 z-[60] animate-in slide-in-from-top-1 duration-200">
          <p className="font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            Connection Error
          </p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      )}
    </div>
  );
}
