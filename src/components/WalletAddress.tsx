"use client";

import { useEffect, useMemo, useState } from "react";
import { formatAddress } from "@/utils/format";
import { resolveFederationAddress } from "@/utils/federation";

interface WalletAddressProps {
  address: string;
  className?: string;
  showCopy?: boolean;
}

type ResolutionState = "loading" | "resolved" | "fallback";

const federationCache = new Map<string, string | null>();

export function clearWalletAddressCacheForTests() {
  federationCache.clear();
}

export default function WalletAddress({
  address,
  className = "",
  showCopy = true,
}: WalletAddressProps) {
  const [state, setState] = useState<ResolutionState>(() =>
    federationCache.has(address) ? "resolved" : "loading",
  );
  const [federationAddress, setFederationAddress] = useState<string | null>(() =>
    federationCache.get(address) ?? null,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!address) {
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setState("fallback");
        setFederationAddress(null);
      });
      return;
    }

    if (federationCache.has(address)) {
      const cached = federationCache.get(address) ?? null;
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setFederationAddress(cached);
        setState(cached ? "resolved" : "fallback");
      });
      return;
    }

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setState("loading");
      setFederationAddress(null);
    });

    void resolveFederationAddress(address)
      .then((resolved) => {
        if (cancelled) return;
        federationCache.set(address, resolved);
        setFederationAddress(resolved);
        setState(resolved ? "resolved" : "fallback");
      })
      .catch(() => {
        if (cancelled) return;
        federationCache.set(address, null);
        setFederationAddress(null);
        setState("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  const displayValue = useMemo(
    () => federationAddress ?? formatAddress(address),
    [address, federationAddress],
  );

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (state === "loading") {
    return (
      <span
        aria-label="Resolving wallet address"
        className={`inline-flex h-5 w-28 animate-pulse rounded bg-surface-dim ${className}`}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-mono" title={address}>
        {displayValue}
      </span>
      {showCopy && (
        <button
          type="button"
          onClick={copyAddress}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          aria-label={copied ? "Wallet address copied" : "Copy wallet address"}
          title={copied ? "Copied" : "Copy wallet address"}
        >
          <span className="material-symbols-outlined text-[14px]">
            {copied ? "check" : "content_copy"}
          </span>
        </button>
      )}
    </span>
  );
}
