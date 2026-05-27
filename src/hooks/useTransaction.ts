"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { Transaction } from "@stellar/stellar-sdk";
import { submitSignedTransaction } from "@/utils/soroban";

interface UseTransactionResult {
  execute: (tx: Transaction, description?: string) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

export function useTransaction(): UseTransactionResult {
  const { signTx, isConnected, address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (tx: Transaction, description?: string) => {
    if (!isConnected || !address) {
      setError("Wallet not connected");
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const { txHash } = await submitSignedTransaction({ tx, signTx });
      // TODO: Potentially show a toast notification here for success
      return txHash;
    } catch (e: any) {
      console.error("Transaction failed:", e);
      setError(e.message || "Transaction failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, signTx]);

  return { execute, loading, error };
}
