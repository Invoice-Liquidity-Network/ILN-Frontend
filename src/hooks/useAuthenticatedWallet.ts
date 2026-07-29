'use client';

import { useContext, useCallback, useRef } from 'react';
import { WalletContext } from '@/context/WalletContext';
import { signTransaction } from '@stellar/freighter-api';
import { NETWORK_PASSPHRASE } from '@/constants';

let jwtToken: string | null = null;

async function fetchSEP10Challenge(publicKey: string): Promise<string> {
  const response = await fetch(`/api/auth/challenge?account=${encodeURIComponent(publicKey)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch SEP-10 challenge: ${response.statusText}`);
  }
  const data = await response.json();
  return data.challenge;
}

async function submitSEP10Challenge(publicKey: string, signedChallenge: string): Promise<string> {
  const response = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account: publicKey,
      transaction: signedChallenge,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to verify SEP-10 challenge: ${response.statusText}`);
  }
  const data = await response.json();
  return data.token;
}

async function performSEP10Auth(publicKey: string): Promise<string> {
  try {
    const challenge = await fetchSEP10Challenge(publicKey);

    const signedChallenge = await signTransaction(challenge, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    if (typeof signedChallenge !== 'string') {
      throw new Error('Failed to sign SEP-10 challenge');
    }

    const jwt = await submitSEP10Challenge(publicKey, signedChallenge);

    jwtToken = jwt;

    return jwt;
  } catch (error) {
    console.error('SEP-10 authentication failed:', error);
    jwtToken = null;
    throw error;
  }
}

export interface UseAuthenticatedWalletReturn {
  isConnected: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (txXdr: string) => Promise<string>;
  jwt: string | null;
}

export function useAuthenticatedWallet(): UseAuthenticatedWalletReturn {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useAuthenticatedWallet must be used within a WalletProvider');
  }

  const authAttemptedRef = useRef(false);

  const connect = useCallback(async () => {
    try {
      await context.connect();

      if (context.address && !authAttemptedRef.current) {
        authAttemptedRef.current = true;
        try {
          jwtToken = await performSEP10Auth(context.address);
        } catch (error) {
          console.error('SEP-10 authentication failed during connect:', error);
          authAttemptedRef.current = false;
          throw error;
        }
      }
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }, [context]);

  const disconnect = useCallback(() => {
    jwtToken = null;
    authAttemptedRef.current = false;

    context.disconnect();
  }, [context]);

  const signTx = useCallback(
    async (txXdr: string): Promise<string> => {
      if (!context.isConnected) {
        throw new Error('Wallet is not connected');
      }
      return context.signTx(txXdr);
    },
    [context]
  );

  return {
    isConnected: context.isConnected,
    publicKey: context.address,
    connect,
    disconnect,
    signTransaction: signTx,
    jwt: jwtToken,
  };
}
