"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/context/ToastContext";

interface UseTransactionOptions {
  pendingTitle: string;
  pendingMessage?: string;
  successTitle: string;
  successMessage?: string;
  errorTitle: string;
}

interface TransactionResult {
  txHash?: string;
}

export function useTransaction({
  pendingTitle,
  pendingMessage,
  successTitle,
  successMessage,
  errorTitle,
}: UseTransactionOptions) {
  const { addToast, updateToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const runTransaction = useCallback(
    async <T extends TransactionResult>(transaction: () => Promise<T>): Promise<T> => {
      setIsPending(true);
      const toastId = addToast({
        type: "pending",
        title: pendingTitle,
        message: pendingMessage,
      });

      try {
        const result = await transaction();
        updateToast(toastId, {
          type: "success",
          title: successTitle,
          message: successMessage,
          txHash: result.txHash,
        });
        return result;
      } catch (error) {
        updateToast(toastId, {
          type: "error",
          title: errorTitle,
          message: error instanceof Error ? error.message : "Transaction failed.",
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [addToast, errorTitle, pendingMessage, pendingTitle, successMessage, successTitle, updateToast],
  );

  return { isPending, runTransaction };
}
