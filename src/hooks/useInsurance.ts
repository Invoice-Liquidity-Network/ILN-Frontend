import { useState, useEffect } from 'react';
import { getInsurancePoolInfo, getLPInsuranceStatus, InsurancePoolInfo } from '@/utils/soroban';
import { useWallet } from '@/context/WalletContext';

export function useInsurance() {
  const { address } = useWallet();
  const [poolInfo, setPoolInfo] = useState<InsurancePoolInfo | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const [info, status] = await Promise.all([
        getInsurancePoolInfo(),
        address ? getLPInsuranceStatus(address) : Promise.resolve(false),
      ]);
      setPoolInfo(info);
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

  return { poolInfo, isEnrolled, isLoading, refresh };
}
