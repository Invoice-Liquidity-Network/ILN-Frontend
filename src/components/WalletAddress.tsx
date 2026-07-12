'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { resolveFederatedAddress } from '@/utils/federation';
import { formatAddress } from '@/utils/format';

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
  className = '',
  truncate = formatAddress,
}: WalletAddressProps) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(address));
  const [copied, setCopied] = useState(false);
  const announceRef = useRef<HTMLDivElement>(null);

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
    typeof resolved === 'string' && resolved.includes('*') && resolved !== address;
  const displayValue = isFederated ? resolved! : truncate(address);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (announceRef.current) {
        announceRef.current.textContent = 'Address copied to clipboard';
      }
      window.setTimeout(() => {
        setCopied(false);
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1500);
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
        <span className="relative inline-flex">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Address copied' : 'Copy wallet address'}
            className="rounded p-1 text-on-surface-variant transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 animate-check-pop" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          {copied && (
            <span
              role="tooltip"
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-surface-container-highest px-2 py-1 text-xs text-on-surface shadow-lg border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200"
            >
              Copied!
              <span className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-surface-container-highest" />
            </span>
          )}
        </span>
      )}
      <div ref={announceRef} role="status" aria-live="polite" className="sr-only" />
    </span>
  );
}
