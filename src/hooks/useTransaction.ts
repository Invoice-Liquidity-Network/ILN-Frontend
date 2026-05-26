"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/context/ToastContext";

export type TransactionPhase = "idle" | "preparing" | "signing" | "success" | "error";

interface TransactionState {
  phase: TransactionPhase;
  error: string | null;
}

interface TransactionControls {
  setSigning: () => void;
}

interface ExecuteOptions<TResult> {
  pendingTitle?: string;
  successTitle?: string;
  successMessage?: string;
  errorTitle?: string;
  onSuccess?: (result: TResult) => void | Promise<void>;
  onError?: (error: Error) => void;
  refresh?: () => void | Promise<void>;
}

type ExecuteTransaction = <TResult>(
  operation: (controls: TransactionControls) => Promise<TResult>,
  options?: ExecuteOptions<TResult>,
) => Promise<TResult | undefined>;

const INITIAL_STATE: TransactionState = {
  phase: "idle",
  error: null,
};

function toError(error: unknown) {
  return error instanceof Error ? error : new Error("The transaction did not complete successfully.");
}

function isWalletRejection(error: Error) {
  return /\b(cancelled|canceled|declined|denied|reject|rejected|user abort)\b/i.test(error.message);
}

export function useTransaction() {
  const { addToast, updateToast } = useToast();
  const [state, setState] = useState<TransactionState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const retryRef = useRef<(() => void) | null>(null);
  const executeRef = useRef<ExecuteTransaction | null>(null);

  const execute = useCallback<ExecuteTransaction>(
    async <TResult,>(
      operation: (controls: TransactionControls) => Promise<TResult>,
      options: ExecuteOptions<TResult> = {},
    ): Promise<TResult | undefined> => {
      retryRef.current = () => {
        void executeRef.current?.(operation, options);
      };

      setIsLoading(true);
      setState({ phase: "preparing", error: null });

      const toastId = addToast({
        type: "pending",
        title: options.pendingTitle ?? "Preparing transaction...",
        message: "Build the transaction, then approve the wallet signature.",
      });

      try {
        const result = await operation({
          setSigning: () => {
            setState({ phase: "signing", error: null });
            updateToast(toastId, {
              title: "Waiting for wallet signature...",
              message: "Confirm the transaction in your wallet.",
            });
          },
        });

        setState({ phase: "success", error: null });
        updateToast(toastId, {
          type: "success",
          title: options.successTitle ?? "Transaction confirmed",
          message: options.successMessage,
        });

        await options.onSuccess?.(result);
        await options.refresh?.();
        return result;
      } catch (caught) {
        const error = toError(caught);
        const cancelled = isWalletRejection(error);
        const message = cancelled ? "Transaction cancelled" : error.message;

        setState({ phase: "error", error: message });
        options.onError?.(error);

        updateToast(toastId, {
          type: "error",
          title: cancelled ? "Transaction cancelled" : options.errorTitle ?? "Transaction failed",
          message: cancelled ? "The wallet signature request was cancelled." : message,
          actionLabel: cancelled ? undefined : "Retry",
          onAction: cancelled ? undefined : () => retryRef.current?.(),
        });

        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, updateToast],
  );
  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setIsLoading(false);
  }, []);

  return {
    execute,
    isLoading,
    reset,
    state,
  };
}
