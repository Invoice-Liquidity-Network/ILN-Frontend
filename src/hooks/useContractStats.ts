"use client";

import { useQuery } from "@tanstack/react-query";
import { get_contract_stats } from "@/utils/contract-stats";

export function useContractStats() {
  return useQuery({
    queryKey: ["contract-stats"],
    queryFn: get_contract_stats,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
