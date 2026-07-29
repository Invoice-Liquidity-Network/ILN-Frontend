'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Invoice } from '@/utils/soroban';

const APP_BASE_URL = 'https://app.iln.finance';

interface ShareInvoiceButtonProps {
  invoice: Invoice;
  /** Overrides the default base URL (primarily for tests). */
  baseUrl?: string;
}

/** Canonical, publicly viewable URL for an invoice's detail page. */
export function invoiceShareUrl(id: bigint, origin: string): string {
  return `${origin.replace(/\/$/, '')}/i/${id.toString()}`;
}

/** Pre-populated mailto link inviting a payer to review an invoice. */
export function invoiceShareMailto(id: bigint, url: string): string {
  const subject = `Invoice #${id.toString()} on ILN`;
  const body = `Hi,\n\nPlease review this invoice on the Invoice Liquidity Network:\n${url}\n\nThanks.`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Lets the submitter share a deep link to an invoice: copies the canonical
 * detail URL (https://app.iln.finance/i/{id}) to the clipboard with a success
 * toast, falls back to a visible input on clipboard failure, and uses the
 * native share sheet on mobile when available.
 */
export default function ShareInvoiceButton({ invoice, baseUrl }: ShareInvoiceButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const fallbackRef = useRef<HTMLInputElement>(null);

  const origin = baseUrl ?? APP_BASE_URL;
  const shareUrl = invoiceShareUrl(invoice.id, origin);

  const handleCopy = async () => {
    // Use native share sheet on mobile when available
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Invoice #${invoice.id.toString()} on ILN`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share unsupported — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — reveal the fallback input field
      setShowFallback(true);
      setTimeout(() => {
        fallbackRef.current?.select();
      }, 0);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => void handleCopy()}
            aria-label="Copy invoice link"
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'link'}
            </span>
            Share Invoice
          </button>
          {copied ? (
            <span
              role="status"
              className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-on-surface px-2.5 py-1 text-xs font-bold text-surface shadow-lg"
            >
              Link copied to clipboard
            </span>
          ) : null}
        </div>
        <a
          href={invoiceShareMailto(invoice.id, shareUrl)}
          aria-label="Share invoice via email"
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[18px]">mail</span>
          Email
        </a>
      </div>

      {showFallback ? (
        <div className="flex items-center gap-2">
          <input
            ref={fallbackRef}
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Invoice share link"
            className="flex-1 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onFocus={(e) => e.target.select()}
          />
        </div>
      ) : null}
    </div>
  );
}
