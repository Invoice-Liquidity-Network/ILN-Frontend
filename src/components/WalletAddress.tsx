"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { resolveFederatedAddress } from "@/utils/federation";
import { formatAddress } from "@/utils/format";

export interface WalletAddressProps {
  address: string;
  /** When true, show only the resolved/truncated text without the copy icon. */
  hideCopy?: boolean;
  /** Optional className applied to the outer span. */
  className?: string;
  /** Override the truncation/formatting of the fallback G-address. */
  truncate?: (address: string) => string;
}

/**
 * WalletAddress renders a Stellar G-address as a human-readable identifier when
 * a Federation address is discoverable, falling back to a truncated G-address.
 *
 * Resolution is cached at the module level (see resolveFederatedAddress), so
 * repeated renders for the same address never re-hit Horizon within a session.
 */
export default function WalletAddress({
  address,
  hideCopy = false,
  className = "",
  truncate = formatAddress,
}: WalletAddressProps) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(address));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    resolveFederatedAddress(address)
      .then((value) => {
        if (!cancelled) {
          setResolved(value);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolved(address);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!address) {
    return <span className={className} data-testid="wallet-address-display" />;
  }

  if (loading) {
    return (
      <span
        className={`skeleton-cell inline-block h-4 w-32 align-middle ${className}`}
        aria-busy="true"
        aria-label="Resolving wallet address"
        data-testid="wallet-address-skeleton"
      />
    );
  }

  const isFederated =
    typeof resolved === "string" && resolved.includes("*") && resolved !== address;
  const displayValue = isFederated ? resolved! : truncate(address);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Silent failure — clipboard may be unavailable (e.g. insecure context).
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 font-mono ${className}`}>
      <span title={address} data-testid="wallet-address-display">
        {displayValue}
      </span>
      {!hideCopy && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Address copied" : "Copy wallet address"}
          className="rounded p-1 text-on-surface-variant transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </span>
  );
}
