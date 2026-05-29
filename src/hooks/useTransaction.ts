import { useState } from "react";
import { useToast } from "@/context/ToastContext";

interface TransactionCopy {
  pendingTitle: string;
  successTitle: string;
  errorTitle: string;
}

export function useTransaction({ pendingTitle, successTitle, errorTitle }: TransactionCopy) {
  const { addToast, updateToast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const runTransaction = async <T,>(transaction: () => Promise<T>): Promise<T> => {
    setIsPending(true);
    const toastId = addToast({ type: "pending", title: pendingTitle });

    try {
      const result = await transaction();
      updateToast(toastId, { type: "success", title: successTitle });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed.";
      updateToast(toastId, { type: "error", title: errorTitle, message });
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { isPending, runTransaction };
}
