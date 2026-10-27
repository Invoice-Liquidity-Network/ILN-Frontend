import { useState, useEffect } from 'react';
import {
  getInsurancePoolHealth,
  getInsurancePoolInfo,
  getLPInsuranceStatus,
  InsurancePoolHealth,
  InsurancePoolInfo,
} from '@/utils/soroban';
import { useWallet } from '@/context/WalletContext';

export function useInsurance() {
  const { address } = useWallet();
  const [poolInfo, setPoolInfo] = useState<InsurancePoolInfo | null>(null);
  const [poolHealth, setPoolHealth] = useState<InsurancePoolHealth | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const [info, health, status] = await Promise.all([
        getInsurancePoolInfo(),
        getInsurancePoolHealth(),
        address ? getLPInsuranceStatus(address) : Promise.resolve(false),
      ]);
      setPoolInfo(info);
      setPoolHealth(health);
      setIsEnrolled(status);
    } catch (error) {
      console.error('Failed to fetch insurance info', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [address]);

  return { poolInfo, poolHealth, isEnrolled, isLoading, refresh };
}
