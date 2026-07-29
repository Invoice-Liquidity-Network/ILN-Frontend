'use client';

import { useQuery } from '@tanstack/react-query';
import { get_contract_stats } from '@/utils/contract-stats';
import { statsKeys, QUERY_TIMINGS } from '@/hooks/queries/keys';

export function useContractStats() {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: get_contract_stats,
    refetchInterval: 60_000,
    ...QUERY_TIMINGS.stats,
  });
}
