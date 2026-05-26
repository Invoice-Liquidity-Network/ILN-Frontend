"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isConnected, getAddress, setAllowed, signTransaction, getNetwork } from "@stellar/freighter-api";
import { NETWORK_NAME, NETWORK_PASSPHRASE } from "@/constants";
import { useToast } from "./ToastContext";
import { getAllInvoices } from "@/utils/soroban";
import { deriveWalletRoles, type WalletRole, type WalletRoleSummary } from "@/utils/walletRoles";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  error: string | null;
  networkMismatch: boolean;
  roles: WalletRole[];
  rolesLoading: boolean;
  roleSummary: WalletRoleSummary;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTx: (txXdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = "iln_wallet_address";
const EMPTY_ROLE_SUMMARY: WalletRoleSummary = {
  roles: [],
  submittedCount: 0,
  payerCount: 0,
  fundedCount: 0,
};

function extractConnectionState(result: unknown): boolean {
  if (typeof result === "boolean") {
    return result;
  }

  if (result && typeof result === "object" && "isConnected" in result) {
    return Boolean((result as { isConnected?: unknown }).isConnected);
  }

  return false;
}

function extractNetworkName(result: unknown): string | null {
  if (typeof result === "string") {
    return result;
  }

  if (result && typeof result === "object" && "network" in result) {
    const network = (result as { network?: unknown }).network;
    return typeof network === "string" ? network : null;
  }

  return null;
}

function extractAllowedState(result: unknown): boolean {
  if (typeof result === "boolean") {
    return result;
  }

  if (result && typeof result === "object" && "isAllowed" in result) {
    return Boolean((result as { isAllowed?: unknown }).isAllowed);
  }

  return false;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast, updateToast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSummary, setRoleSummary] = useState<WalletRoleSummary>(EMPTY_ROLE_SUMMARY);

  const checkNetwork = useCallback(async () => {
    try {
      const network = extractNetworkName(await getNetwork());
      if (network && network.toUpperCase() !== NETWORK_NAME) {
        setNetworkMismatch(true);
        return false;
      }
      setNetworkMismatch(false);
      return true;
    } catch (e) {
      console.error("Failed to get network", e);
      return false;
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const installed = extractConnectionState(await isConnected());
      setIsInstalled(installed);
      
      if (installed) {
        const savedAddress = localStorage.getItem(STORAGE_KEY);
        if (savedAddress) {
          const { address } = await getAddress();
          if (address && address === savedAddress) {
            setAddress(address);
            await checkNetwork();
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.error("Check connection failed", e);
    }
  }, [checkNetwork]);

  useEffect(() => {
    void Promise.resolve().then(checkConnection);
  }, [checkConnection]);

  useEffect(() => {
    let cancelled = false;

    if (!address) {
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setRoleSummary(EMPTY_ROLE_SUMMARY);
        setRolesLoading(false);
      });
      return;
    }

    void Promise.resolve().then(() => {
      if (!cancelled) setRolesLoading(true);
    });

    void getAllInvoices()
      .then((invoices) => {
        if (cancelled) return;
        setRoleSummary(deriveWalletRoles(address, invoices));
      })
      .catch((e) => {
        console.error("Role detection failed", e);
        if (!cancelled) setRoleSummary(EMPTY_ROLE_SUMMARY);
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (address) checkNetwork();
    }, 5000);
    return () => clearInterval(interval);
  }, [address, checkNetwork]);

  const connect = async () => {
    setError(null);
    const toastId = addToast({ type: "pending", title: "Connecting to Freighter..." });
    
    try {
      const installed = extractConnectionState(await isConnected());
      if (!installed) {
        const msg = "Freighter not installed. Please install the extension.";
        setError(msg);
        updateToast(toastId, { type: "error", title: "Connection Failed", message: msg });
        window.open("https://www.freighter.app/", "_blank");
        return;
      }

      const isAllowed = extractAllowedState(await setAllowed());
      if (isAllowed) {
        const { address, error: freighterError } = await getAddress();
        
        if (freighterError) {
          setError(freighterError);
          updateToast(toastId, { type: "error", title: "Connection Failed", message: freighterError });
          return;
        }

        if (address) {
          setAddress(address);
          localStorage.setItem(STORAGE_KEY, address);
          
          const isCorrectNetwork = await checkNetwork();
          if (!isCorrectNetwork) {
            const networkMsg = `Please switch Freighter to ${NETWORK_NAME}`;
            setError(networkMsg);
            updateToast(toastId, { type: "error", title: "Network Mismatch", message: networkMsg });
          } else {
            updateToast(toastId, { type: "success", title: "Connected", message: `Connected as ${address.substring(0, 6)}...` });
          }
        }
      } else {
        const msg = "Connection rejected by user.";
        setError(msg);
        updateToast(toastId, { type: "error", title: "Connection Failed", message: msg });
      }
    } catch (e: unknown) {
      console.error("Connection error:", e);
      const msg = e instanceof Error ? e.message : "Connection failed";
      setError(msg);
      updateToast(toastId, { type: "error", title: "Connection Failed", message: msg });
    }
  };

  const disconnect = () => {
    setAddress(null);
    setNetworkMismatch(false);
    setError(null);
    setRoleSummary(EMPTY_ROLE_SUMMARY);
    setRolesLoading(false);
    localStorage.removeItem(STORAGE_KEY);
    addToast({ type: "success", title: "Disconnected" });
  };

  const signTx = async (txXdr: string) => {
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      const msg = `Network mismatch. Please switch to ${NETWORK_NAME}`;
      addToast({ type: "error", title: "Transaction Failed", message: msg });
      throw new Error(msg);
    }
    const signed = await signTransaction(txXdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    if (typeof signed === "string") {
      return signed;
    }

    if (signed.error) {
      throw new Error(String(signed.error));
    }

    if (signed.signedTxXdr) {
      return signed.signedTxXdr;
    }

    throw new Error("Freighter did not return a signed transaction.");
  };

  return (
    <WalletContext.Provider 
      value={{ 
        address, 
        isConnected: !!address, 
        isInstalled,
        error,
        networkMismatch,
        roles: roleSummary.roles,
        rolesLoading,
        roleSummary,
        connect, 
        disconnect, 
        signTx 
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
