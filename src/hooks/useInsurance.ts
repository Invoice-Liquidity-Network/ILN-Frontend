import { useState, useEffect, useCallback } from 'react';
import { getInsurancePoolInfo, getLPInsuranceStatus, InsurancePoolInfo } from '@/utils/soroban';
import { useWallet } from '@/context/WalletContext';
import { parseContractError, CONTRACT_ERROR_MAP } from '@/lib/contract/errors';

export function useInsurance() {
  const { address } = useWallet();
  const [poolInfo, setPoolInfo] = useState<InsurancePoolInfo | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [info, status] = await Promise.all([
        getInsurancePoolInfo(),
        address ? getLPInsuranceStatus(address) : Promise.resolve(false),
      ]);
      setPoolInfo(info);
      setIsEnrolled(status);
    } catch (error) {
      const code = parseContractError(error);
      const message = code ? CONTRACT_ERROR_MAP[code].message : 'Failed to fetch insurance info';
      console.error('Failed to fetch insurance info:', message, error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [info, status] = await Promise.all([
          getInsurancePoolInfo(),
          address ? getLPInsuranceStatus(address) : Promise.resolve(false),
        ]);
        if (!cancelled) {
          setPoolInfo(info);
          setIsEnrolled(status);
        }
      } catch (error) {
        if (!cancelled) {
          const code = parseContractError(error);
          const message = code
            ? CONTRACT_ERROR_MAP[code].message
            : 'Failed to fetch insurance info';
          console.error('Failed to fetch insurance info:', message, error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return { poolInfo, isEnrolled, isLoading, refresh };
}
