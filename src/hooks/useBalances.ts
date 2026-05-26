"use client";

import { useEffect, useMemo, useState } from "react";
import { HORIZON_URL } from "@/constants";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import { WALLET_BALANCES_REFRESH_EVENT } from "@/utils/balanceRefresh";

const BALANCE_REFRESH_INTERVAL_MS = 30_000;

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

export function useBalances({
  address,
  enabled,
  tokens,
}: {
  address: string | null;
  enabled: boolean;
  tokens: ApprovedToken[];
}) {
  const [amounts, setAmounts] = useState<Map<string, bigint>>(new Map());
  const [missingTrustlines, setMissingTrustlines] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = window.setInterval(() => {
      setRefreshNonce((current) => current + 1);
    }, BALANCE_REFRESH_INTERVAL_MS);
    const handleRefresh = () => setRefreshNonce((current) => current + 1);

    window.addEventListener(WALLET_BALANCES_REFRESH_EVENT, handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(WALLET_BALANCES_REFRESH_EVENT, handleRefresh);
    };
  }, [enabled]);

  useEffect(() => {
    let cancelled = false;

    async function loadBalances() {
      if (!address || !enabled || tokens.length === 0) {
        setAmounts(new Map());
        setMissingTrustlines(new Set());
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { nextAmounts, nextMissingTrustlines } = await getHorizonBalances(address, tokens);

      if (!cancelled) {
        setAmounts(nextAmounts);
        setMissingTrustlines(nextMissingTrustlines);
        setIsLoading(false);
      }
    }

    loadBalances();

    return () => {
      cancelled = true;
    };
  }, [address, enabled, refreshNonce, tokens]);

  const balances = useMemo<WalletBalance[]>(
    () =>
      tokens.map((token) => ({
        amount: amounts.get(token.contractId) ?? 0n,
        contractId: token.contractId,
        hasTrustline: !missingTrustlines.has(token.contractId),
        isLoading,
        token,
      })),
    [amounts, isLoading, missingTrustlines, tokens],
  );

  return {
    balances,
    isLoading,
    refresh: () => setRefreshNonce((current) => current + 1),
  };
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
