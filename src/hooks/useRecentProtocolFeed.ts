"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRecentProtocolContractEvents } from "@/lib/fetch-protocol-contract-events";
import { buildProtocolFeedItems } from "@/utils/protocol-feed";
import { getAllInvoices } from "@/utils/soroban";

export const PROTOCOL_FEED_QUERY_KEY = ["protocol-recent-feed"] as const;

const POLL_INTERVAL_MS = 60_000;

export function useRecentProtocolFeed() {
  return useQuery({
    queryKey: PROTOCOL_FEED_QUERY_KEY,
    queryFn: async () => {
      const [events, invoices] = await Promise.all([
        fetchRecentProtocolContractEvents(),
        getAllInvoices(),
      ]);
      const invoicesById = new Map(invoices.map((invoice) => [invoice.id.toString(), invoice]));
      return buildProtocolFeedItems(events, invoicesById, 10);
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS - 5_000,
  });
}
