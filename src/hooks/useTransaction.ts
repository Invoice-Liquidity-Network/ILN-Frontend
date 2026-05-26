"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { submitSignedTransaction } from "@/utils/soroban";
import type { Transaction } from "@stellar/stellar-sdk";

export type TransactionState = "idle" | "preparing" | "signing" | "success" | "error";

export function useTransaction() {
  const { signTx } = useWallet();
  const [state, setState] = useState<TransactionState>("idle");
  const [error, setError] = useState<string | null>(null);

  const runTransaction = async (buildTransaction: () => Promise<Transaction>) => {
    setState("preparing");
    setError(null);

    try {
      const tx = await buildTransaction();
      setState("signing");
      const result = await submitSignedTransaction({ tx, signTx });
      setState("success");
      return result;
    } catch (transactionError) {
      const message = transactionError instanceof Error ? transactionError.message : "Transaction failed.";
      setError(message);
      setState("error");
      throw transactionError;
    }
  };

  const reset = () => {
    setState("idle");
    setError(null);
  };

  return {
    state,
    error,
    isPending: state === "preparing" || state === "signing",
    runTransaction,
    reset,
  };
}
