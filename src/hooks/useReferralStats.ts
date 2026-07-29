'use client';

import { useQuery } from '@tanstack/react-query';
import { getReferralStats } from '@/utils/soroban';
import { QUERY_TIMINGS } from '@/hooks/queries/keys';

export function useReferralStats(code: string) {
  return useQuery({
    queryKey: ['referral-stats', code],
    queryFn: () => getReferralStats(code),
    enabled: !!code,
    refetchInterval: 60_000,
    ...QUERY_TIMINGS.stats,
  });
}
