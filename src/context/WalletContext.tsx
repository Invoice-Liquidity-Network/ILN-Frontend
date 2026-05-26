"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isConnected, getAddress, setAllowed, signTransaction, getNetwork } from "@stellar/freighter-api";
import { NETWORK_NAME, NETWORK_PASSPHRASE } from "@/constants";
import { useToast } from "./ToastContext";
import {
  connectWalletConnect,
  disconnectWalletConnect,
  signWalletConnectTransaction,
} from "@/utils/walletConnect";

export type WalletProviderId = "freighter" | "walletconnect";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  error: string | null;
  networkMismatch: boolean;
  provider: WalletProviderId | null;
  connect: () => Promise<void>;
  connectProvider: (provider: WalletProviderId) => Promise<void>;
  disconnect: () => void;
  signTx: (txXdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const STORAGE_KEY = "iln_wallet_address";
const PROVIDER_STORAGE_KEY = "iln_wallet_provider";

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

function getErrorMessage(error: unknown, fallback = "Connection failed") {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast, updateToast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkMismatch, setNetworkMismatch] = useState(false);
  const [provider, setProvider] = useState<WalletProviderId | null>(null);

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
      const savedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY);
      const savedAddress = localStorage.getItem(STORAGE_KEY);

      if (savedProvider === "walletconnect" && savedAddress) {
        setAddress(savedAddress);
        setProvider("walletconnect");
        setIsInstalled(true);
        setNetworkMismatch(false);
        return;
      }

      const installed = extractConnectionState(await isConnected());
      setIsInstalled(installed);
      
      if (installed) {
        if (savedAddress) {
          const { address: freighterAddress } = await getAddress();
          if (freighterAddress && freighterAddress === savedAddress) {
            setAddress(freighterAddress);
            setProvider("freighter");
            await checkNetwork();
          } else {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(PROVIDER_STORAGE_KEY);
          }
        }
      }
    } catch (e) {
      console.error("Check connection failed", e);
    }
  }, [checkNetwork]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void checkConnection();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [checkConnection]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (address) checkNetwork();
    }, 5000);
    return () => clearInterval(interval);
  }, [address, checkNetwork]);

  const connectWithFreighter = async () => {
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
          setProvider("freighter");
          localStorage.setItem(STORAGE_KEY, address);
          localStorage.setItem(PROVIDER_STORAGE_KEY, "freighter");
          
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
      const msg = getErrorMessage(e);
      setError(msg);
      updateToast(toastId, { type: "error", title: "Connection Failed", message: msg });
    }
  };

  const connectWithWalletConnect = async () => {
    setError(null);
    setNetworkMismatch(false);
    const toastId = addToast({ type: "pending", title: "Opening WalletConnect..." });

    try {
      const { address } = await connectWalletConnect();
      setAddress(address);
      setProvider("walletconnect");
      localStorage.setItem(STORAGE_KEY, address);
      localStorage.setItem(PROVIDER_STORAGE_KEY, "walletconnect");
      updateToast(toastId, {
        type: "success",
        title: "Connected",
        message: `Connected with WalletConnect as ${address.substring(0, 6)}...`,
      });
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      setError(msg);
      updateToast(toastId, { type: "error", title: "WalletConnect Failed", message: msg });
    }
  };

  const connectProvider = async (nextProvider: WalletProviderId) => {
    if (nextProvider === "walletconnect") {
      await connectWithWalletConnect();
      return;
    }

    await connectWithFreighter();
  };

  const connect = async () => {
    await connectWithFreighter();
  };

  const disconnect = () => {
    if (provider === "walletconnect") {
      disconnectWalletConnect().catch((e: unknown) => {
        console.error("WalletConnect disconnect failed", e);
      });
    }
    setAddress(null);
    setProvider(null);
    setNetworkMismatch(false);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROVIDER_STORAGE_KEY);
    addToast({ type: "success", title: "Disconnected" });
  };

  const signTx = async (txXdr: string) => {
    if (provider === "walletconnect") {
      if (!address) {
        throw new Error("WalletConnect is not connected.");
      }

      try {
        return await signWalletConnectTransaction(txXdr, address);
      } catch (e: unknown) {
        const msg = getErrorMessage(e, "WalletConnect session expired. Reconnect your wallet and try again.");
        setAddress(null);
        setProvider(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROVIDER_STORAGE_KEY);
        addToast({ type: "error", title: "WalletConnect Failed", message: msg });
        throw new Error(msg);
      }
    }

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
        provider,
        connect, 
        connectProvider,
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
