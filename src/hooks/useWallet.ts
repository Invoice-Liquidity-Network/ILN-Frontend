"use client";

import { useContext, useCallback, useRef } from "react";
import { WalletContext } from "@/context/WalletContext";
import { signTransaction } from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "@/constants";

/**
 * SEP-10 authentication state and token management.
 * JWT is stored in memory (not localStorage) and cleared on disconnect.
 */
let jwtToken: string | null = null;

/**
 * Fetches a SEP-10 challenge from the server for the given public key.
 */
async function fetchSEP10Challenge(publicKey: string): Promise<string> {
  const response = await fetch(`/api/auth/challenge?account=${encodeURIComponent(publicKey)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch SEP-10 challenge: ${response.statusText}`);
  }
  const data = await response.json();
  return data.challenge;
}

/**
 * Submits a signed SEP-10 challenge to the server to obtain a JWT.
 */
async function submitSEP10Challenge(
  publicKey: string,
  signedChallenge: string,
): Promise<string> {
  const response = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

/**
 * Performs the complete SEP-10 authentication flow:
 * 1. Fetch challenge from server
 * 2. Sign challenge with user's wallet
 * 3. Submit signed challenge to verify and get JWT
 * 4. Store JWT in memory
 */
async function performSEP10Auth(publicKey: string): Promise<string> {
  try {
    // Step 1: Get challenge
    const challenge = await fetchSEP10Challenge(publicKey);

    // Step 2: Sign challenge via wallet
    const signedChallenge = await signTransaction(challenge, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    // Ensure we got a string response from the wallet
    if (typeof signedChallenge !== "string") {
      throw new Error("Failed to sign SEP-10 challenge");
    }

    // Step 3: Verify and get JWT
    const jwt = await submitSEP10Challenge(publicKey, signedChallenge);

    // Step 4: Store in memory
    jwtToken = jwt;

    return jwt;
  } catch (error) {
    console.error("SEP-10 authentication failed:", error);
    jwtToken = null;
    throw error;
  }
}

export interface UseWalletReturn {
  /** Wallet is currently connected */
  isConnected: boolean;
  /** Public key of the connected wallet */
  publicKey: string | null;
  /** Connect wallet and perform SEP-10 auth */
  connect: () => Promise<void>;
  /** Disconnect wallet and clear JWT */
  disconnect: () => void;
  /** Sign a transaction with the connected wallet */
  signTransaction: (txXdr: string) => Promise<string>;
  /** Current JWT token (in memory only) */
  jwt: string | null;
}

/**
 * Hook for wallet connection and SEP-10 authentication.
 *
 * Consumes WalletProvider context and exposes a clean interface:
 * - Handles SEP-10 challenge/verify flow on first connect
 * - Stores JWT in memory (not localStorage)
 * - Clears JWT on disconnect
 *
 * @throws {Error} if useWallet is used outside a WalletProvider
 */
export function useWallet(): UseWalletReturn {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  // Track if we've already performed SEP-10 auth in this session
  const authAttemptedRef = useRef(false);

  const connect = useCallback(async () => {
    try {
      // First, connect the wallet via the existing context
      await context.connect();

      // Once wallet is connected and we have the address, perform SEP-10
      if (context.address && !authAttemptedRef.current) {
        authAttemptedRef.current = true;
        try {
          jwtToken = await performSEP10Auth(context.address);
        } catch (error) {
          // SEP-10 auth failed, but wallet is still connected
          console.error("SEP-10 authentication failed during connect:", error);
          // Reset the flag so it can be retried
          authAttemptedRef.current = false;
          throw error;
        }
      }
    } catch (error) {
      console.error("Connection failed:", error);
      throw error;
    }
  }, [context]);

  const disconnect = useCallback(() => {
    // Clear JWT from memory
    jwtToken = null;
    authAttemptedRef.current = false;

    // Disconnect via context
    context.disconnect();
  }, [context]);

  const signTx = useCallback(
    async (txXdr: string): Promise<string> => {
      if (!context.isConnected) {
        throw new Error("Wallet is not connected");
      }
      return context.signTx(txXdr);
    },
    [context],
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
