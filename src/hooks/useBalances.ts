"use client";

import { useEffect, useMemo, useState } from "react";
import { HORIZON_URL } from "@/constants";
import { useWallet } from "@/context/WalletContext";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import { getTokenBalance } from "@/utils/soroban";
import { WALLET_BALANCES_REFRESH_EVENT } from "@/utils/balanceRefresh";

const BALANCE_REFRESH_INTERVAL_MS = 30_000;

export type TokenBalanceMap = Map<string, bigint>;

export interface WalletBalance {
  contractId: string;
  amount: bigint;
  hasTrustline: boolean;
  isLoading: boolean;
  token: ApprovedToken;
}

interface HorizonAccountResponse {
  balances?: Array<{
    asset_code?: string;
    asset_type?: string;
    balance?: string;
  }>;
}

interface WalletBalanceArgs {
  address: string | null;
  enabled: boolean;
  tokens: ApprovedToken[];
}

export function useBalances(tokens: ApprovedToken[], enabled?: boolean): {
  balances: TokenBalanceMap;
  isLoading: boolean;
};
export function useBalances(args: WalletBalanceArgs): {
  balances: WalletBalance[];
  isLoading: boolean;
  refresh: () => void;
};
export function useBalances(
  input: ApprovedToken[] | WalletBalanceArgs,
  enabled = true,
):
  | { balances: TokenBalanceMap; isLoading: boolean }
  | { balances: WalletBalance[]; isLoading: boolean; refresh: () => void } {
  let wallet: ReturnType<typeof useWallet> | null = null;
  try {
    // The object overload can be used outside WalletProvider; the array overload uses wallet state when available.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    wallet = useWallet();
  } catch {
    wallet = null;
  }
  const isWalletMode = !Array.isArray(input);
  const tokens = isWalletMode ? input.tokens : input;
  const effectiveAddress = isWalletMode ? input.address : wallet?.address ?? null;
  const effectiveEnabled = isWalletMode
    ? input.enabled
    : enabled && Boolean(wallet?.isConnected) && !wallet?.networkMismatch;

  const [contractBalances, setContractBalances] = useState<TokenBalanceMap>(new Map());
  const [walletAmounts, setWalletAmounts] = useState<Map<string, bigint>>(new Map());
  const [missingTrustlines, setMissingTrustlines] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const balanceTokenIds = useMemo(
    () => tokens.filter((token) => token.isAllowed).map((token) => token.contractId),
    [tokens],
  );

  useEffect(() => {
    if (!isWalletMode || !effectiveEnabled) return;

    const intervalId = window.setInterval(() => {
      setRefreshNonce((current) => current + 1);
    }, BALANCE_REFRESH_INTERVAL_MS);
    const handleRefresh = () => setRefreshNonce((current) => current + 1);

    window.addEventListener(WALLET_BALANCES_REFRESH_EVENT, handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(WALLET_BALANCES_REFRESH_EVENT, handleRefresh);
    };
  }, [effectiveEnabled, isWalletMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadBalances() {
      if (!effectiveEnabled || !effectiveAddress || tokens.length === 0) {
        setContractBalances(new Map());
        setWalletAmounts(new Map());
        setMissingTrustlines(new Set());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      if (isWalletMode) {
        const { nextAmounts, nextMissingTrustlines } = await getHorizonBalances(effectiveAddress, tokens);

        if (!cancelled) {
          setWalletAmounts(nextAmounts);
          setMissingTrustlines(nextMissingTrustlines);
          setIsLoading(false);
        }
        return;
      }

      try {
        const results = await Promise.allSettled(
          balanceTokenIds.map(async (contractId) => ({
            contractId,
            amount: await getTokenBalance(effectiveAddress, contractId),
          })),
        );

        if (cancelled) return;
        const next = new Map<string, bigint>();
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            next.set(result.value.contractId, result.value.amount);
          }
        });
        setContractBalances(next);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBalances();

    return () => {
      cancelled = true;
    };
  }, [balanceTokenIds, effectiveAddress, effectiveEnabled, isWalletMode, refreshNonce, tokens]);

  const walletBalances = useMemo<WalletBalance[]>(
    () =>
      tokens.map((token) => ({
        amount: walletAmounts.get(token.contractId) ?? 0n,
        contractId: token.contractId,
        hasTrustline: !missingTrustlines.has(token.contractId),
        isLoading,
        token,
      })),
    [isLoading, missingTrustlines, tokens, walletAmounts],
  );

  if (isWalletMode) {
    return {
      balances: walletBalances,
      isLoading,
      refresh: () => setRefreshNonce((current) => current + 1),
    };
  }

  return { balances: contractBalances, isLoading };
}

export function isNativeToken(token: Pick<ApprovedToken, "contractId" | "symbol">) {
  return token.symbol.toUpperCase() === "XLM" || token.contractId === "native";
}

async function getHorizonBalances(address: string, tokens: ApprovedToken[]) {
  const nextAmounts = new Map<string, bigint>();
  const nextMissingTrustlines = new Set<string>();

  try {
    const account = await getHorizonAccount(address);

    tokens.forEach((token) => {
      const horizonBalance = findHorizonBalance(account, token);

      nextAmounts.set(token.contractId, parseDecimalAmountToUnits(horizonBalance?.balance ?? "0", token.decimals));

      if (!isNativeToken(token) && !horizonBalance) {
        nextMissingTrustlines.add(token.contractId);
      }
    });
  } catch {
    tokens.forEach((token) => {
      nextAmounts.set(token.contractId, 0n);
      if (!isNativeToken(token)) {
        nextMissingTrustlines.add(token.contractId);
      }
    });
  }

  return { nextAmounts, nextMissingTrustlines };
}

async function getHorizonAccount(address: string) {
  const response = await fetch(`${HORIZON_URL.replace(/\/$/, "")}/accounts/${address}`);

  if (!response.ok) {
    throw new Error("Failed to fetch Horizon account balances.");
  }

  return (await response.json()) as HorizonAccountResponse;
}

function findHorizonBalance(account: HorizonAccountResponse, token: ApprovedToken) {
  if (isNativeToken(token)) {
    return account.balances?.find((balance) => balance.asset_type === "native");
  }

  return account.balances?.find((balance) => balance.asset_code?.toUpperCase() === token.symbol.toUpperCase());
}

function parseDecimalAmountToUnits(value: string, decimals: number) {
  const normalized = value.trim();

  if (!new RegExp(`^\\d+(\\.\\d{0,${decimals}})?$`).test(normalized)) {
    return 0n;
  }

  const [wholePart, decimalPart = ""] = normalized.split(".");
  const unitBase = 10n ** BigInt(decimals);
  const whole = BigInt(wholePart) * unitBase;
  const fraction = BigInt((decimalPart + "0".repeat(decimals)).slice(0, decimals));

  return whole + fraction;
}
