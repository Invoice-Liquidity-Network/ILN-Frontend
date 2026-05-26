"use client";

import { useCallback, useEffect, useState } from "react";
import { Droplets } from "lucide-react";
import { NETWORK_NAME } from "@/constants";
import { useToast } from "@/context/ToastContext";
import { useWallet } from "@/context/WalletContext";

const FRIENDBOT_URL = "https://friendbot.stellar.org";
const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
const MINIMUM_USEFUL_XLM = 1;

type BalanceState = "idle" | "loading" | "ready" | "error";

function isTestnetBuild() {
  const configuredNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? NETWORK_NAME;
  return configuredNetwork.toLowerCase() === "testnet";
}

async function fetchNativeXlmBalance(address: string): Promise<number> {
  const response = await fetch(`${HORIZON_TESTNET_URL}/accounts/${encodeURIComponent(address)}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return 0;
  }

  if (!response.ok) {
    throw new Error("Unable to check testnet XLM balance.");
  }

  const account = (await response.json()) as {
    balances?: Array<{ asset_type?: string; balance?: string }>;
  };
  const nativeBalance = account.balances?.find((balance) => balance.asset_type === "native");
  return Number(nativeBalance?.balance ?? 0);
}

async function requestFriendbotFunding(address: string) {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!response.ok) {
    throw new Error("Friendbot could not fund this wallet.");
  }
}

export default function FaucetButton() {
  const { address, isConnected } = useWallet();
  const { addToast } = useToast();
  const [balanceState, setBalanceState] = useState<BalanceState>("idle");
  const [xlmBalance, setXlmBalance] = useState<number | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const canRender = isTestnetBuild() && isConnected && !!address;

  const loadBalance = useCallback(async () => {
    if (!canRender || !address) {
      setBalanceState("idle");
      setXlmBalance(null);
      return;
    }

    setBalanceState("loading");
    try {
      const nextBalance = await fetchNativeXlmBalance(address);
      setXlmBalance(nextBalance);
      setBalanceState("ready");
    } catch {
      setXlmBalance(null);
      setBalanceState("error");
    }
  }, [address, canRender]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!canRender || !address) {
        setBalanceState("idle");
        setXlmBalance(null);
        return;
      }

      setBalanceState("loading");
      try {
        const nextBalance = await fetchNativeXlmBalance(address);
        if (!cancelled) {
          setXlmBalance(nextBalance);
          setBalanceState("ready");
        }
      } catch {
        if (!cancelled) {
          setXlmBalance(null);
          setBalanceState("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [address, canRender]);

  if (!canRender) {
    return null;
  }

  const hasEnoughXlm = xlmBalance !== null && xlmBalance >= MINIMUM_USEFUL_XLM;
  const isDisabled = balanceState === "loading" || isRequesting || hasEnoughXlm;
  const buttonLabel = isRequesting
    ? "Requesting XLM..."
    : balanceState === "loading"
      ? "Checking XLM..."
      : hasEnoughXlm
        ? "XLM funded"
        : "Get Testnet XLM";

  async function handleRequest() {
    if (!address || isDisabled) return;

    setIsRequesting(true);
    try {
      await requestFriendbotFunding(address);
      addToast({
        type: "success",
        title: "Testnet XLM funded",
        message: "Friendbot added testnet XLM to your wallet.",
      });
      await loadBalance();
    } catch (error) {
      addToast({
        type: "error",
        title: "Faucet request failed",
        message: error instanceof Error ? error.message : "Unable to request testnet XLM.",
      });
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleRequest()}
        disabled={isDisabled}
        className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-variant px-3 py-2 text-xs font-bold text-on-surface-variant transition-all hover:bg-surface-dim active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Droplets aria-hidden="true" className="h-3.5 w-3.5" />
        {buttonLabel}
      </button>
      {balanceState === "error" ? (
        <p className="max-w-[180px] text-right text-[11px] text-on-surface-variant">
          Balance check unavailable. You can still request testnet XLM.
        </p>
      ) : xlmBalance !== null ? (
        <p className="text-[11px] text-on-surface-variant">{xlmBalance.toFixed(2)} XLM available</p>
      ) : null}
    </div>
  );
}
