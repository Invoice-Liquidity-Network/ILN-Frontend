"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectHorizonTransactionStream } from "@/lib/horizon-stream";
import {
  applyContractEventToInvoices,
  type ParsedContractEvent,
} from "@/lib/contract-events";
import {
  isContractEventStreamingActive,
  setContractEventStreamingActive,
} from "@/lib/contract-event-stream-state";
import type { Invoice } from "@/utils/soroban";
import { invoiceKeys } from "@/hooks/queries/keys";

function patchInvoiceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  event: ParsedContractEvent,
) {
  queryClient.setQueryData<Invoice[]>(invoiceKeys.all, (current) =>
    applyContractEventToInvoices(current, event),
  );
  if (event.invoiceId !== undefined) {
    queryClient.setQueryData<Invoice>(invoiceKeys.detail(event.invoiceId), (current) => {
      if (!current) return current;
      const updated = applyContractEventToInvoices([current], event);
      return updated?.[0] ?? current;
    });
    queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(event.invoiceId) });
  }
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export function useContractEvents(enabled = true) {
  const queryClient = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [manualRefresh, setManualRefresh] = useState(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback((attempt: number) => {
    const handle = connectHorizonTransactionStream({
      onEvent: (event) => {
        patchInvoiceQueries(queryClient, event);
        setError(null);
        setRetryCount(0);
      },
      onStatusChange: (status) => {
        setContractEventStreamingActive(status === "connected");
        if (status === "error" || status === "disconnected") {
          if (attempt < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            if (process.env.NODE_ENV === "development") {
              console.error(`[ContractEventSync] Connection failed. Retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
            }
            setError(`Connection lost. Retrying... (${attempt + 1}/${MAX_RETRIES})`);
            setRetryCount(attempt + 1);
            retryTimeout.current = setTimeout(() => connect(attempt + 1), delay);
          } else {
            setError("Failed to connect after 3 attempts. Please refresh manually.");
            if (process.env.NODE_ENV === "development") {
              console.error("[ContractEventSync] Max retries reached.");
            }
          }
        }
      },
    });
    return handle;
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;
    setError(null);
    setRetryCount(0);
    const handle = connect(0);
    return () => {
      handle.close();
      setContractEventStreamingActive(false);
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, [enabled, connect, manualRefresh]);

  const refresh = useCallback(() => {
    setRetryCount(0);
    setError(null);
    setManualRefresh((n) => n + 1);
  }, []);

  return { error, retryCount, refresh };
}

export { isContractEventStreamingActive };
