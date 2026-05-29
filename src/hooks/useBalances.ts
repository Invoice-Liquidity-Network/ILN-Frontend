"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import type { ApprovedToken } from "@/hooks/useApprovedTokens";
import { getTokenBalance } from "@/utils/soroban";
import { TX_SUCCESS_EVENT } from "@/utils/txEvents";

export type TokenBalanceMap = Map<string, bigint>;

/** Wallet balances refresh on this cadence while the consumer is mounted. */
export const BALANCE_REFRESH_INTERVAL_MS = 30_000;

export interface UseBalancesResult {
  /** Token contractId → balance, for every token whose balance loaded. */
  balances: TokenBalanceMap;
  /**
   * Token contractIds whose balance could not be read (e.g. no trustline / RPC
   * error). Callers render these as "0.00" with an "Add Trustline" prompt rather
   * than dropping them silently.
   */
  unavailable: Set<string>;
  isLoading: boolean;
  /** Force an immediate refetch. */
  refetch: () => void;
}

/**
 * Reads balances for the connected wallet across the supplied approved tokens.
 *
 * Refetches automatically every {@link BALANCE_REFRESH_INTERVAL_MS} and whenever
 * a transaction settles (the {@link TX_SUCCESS_EVENT} window event), so balances
 * stay current without the user reconnecting. Tokens that fail to load are
 * surfaced in `unavailable` instead of being silently dropped.
 */
export function useBalances(tokens: ApprovedToken[], enabled = true): UseBalancesResult {
  const { address, isConnected, networkMismatch } = useWallet();
  const [balances, setBalances] = useState<TokenBalanceMap>(new Map());
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const balanceTokenIds = useMemo(
    () => tokens.filter((token) => token.isAllowed).map((token) => token.contractId),
    [tokens],
  );
  // Stable string key so the load callback isn't recreated on every render.
  const tokenKey = balanceTokenIds.join(",");

  const refetch = useCallback(async () => {
    if (!enabled || !address || !isConnected || networkMismatch || tokenKey.length === 0) {
      if (mountedRef.current) {
        setBalances(new Map());
        setUnavailable(new Set());
        setIsLoading(false);
      }
      return;
    }

    const ids = tokenKey.split(",");
    if (mountedRef.current) setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map(async (contractId) => ({
          contractId,
          amount: await getTokenBalance(address, contractId),
        })),
      );

      if (!mountedRef.current) return;
      const nextBalances = new Map<string, bigint>();
      const nextUnavailable = new Set<string>();
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextBalances.set(result.value.contractId, result.value.amount);
        } else {
          nextUnavailable.add(ids[index]);
        }
      });
      setBalances(nextBalances);
      setUnavailable(nextUnavailable);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [address, enabled, isConnected, networkMismatch, tokenKey]);

  useEffect(() => {
    mountedRef.current = true;
    void refetch();

    const interval = setInterval(() => void refetch(), BALANCE_REFRESH_INTERVAL_MS);
    const onTxSuccess = () => void refetch();
    if (typeof window !== "undefined") {
      window.addEventListener(TX_SUCCESS_EVENT, onTxSuccess);
    }

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener(TX_SUCCESS_EVENT, onTxSuccess);
      }
    };
  }, [refetch]);

  return { balances, unavailable, isLoading, refetch: () => void refetch() };
}
