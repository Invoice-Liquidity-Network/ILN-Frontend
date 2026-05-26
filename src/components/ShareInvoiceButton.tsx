"use client";

import { useMemo, useState } from "react";
import { buildInvoiceCanonicalUrl, buildInvoiceMailtoUrl } from "@/utils/invoiceSharing";

export default function ShareInvoiceButton({ invoiceId }: { invoiceId: string | bigint }) {
  const [copied, setCopied] = useState(false);
  const invoiceUrl = useMemo(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return buildInvoiceCanonicalUrl(invoiceId, origin);
  }, [invoiceId]);
  const mailtoUrl = useMemo(
    () => buildInvoiceMailtoUrl(invoiceId, invoiceUrl),
    [invoiceId, invoiceUrl],
  );

  async function copyLink() {
    await navigator.clipboard.writeText(invoiceUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-container/30 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary-container/50"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">
          link
        </span>
        Share Invoice
      </button>
      <a
        href={mailtoUrl}
        className="inline-flex items-center gap-2 rounded-full border border-outline-variant/25 bg-surface-container px-3 py-2 text-xs font-bold text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">
          mail
        </span>
        Share via email
      </a>
      {copied && (
        <span
          role="status"
          className="absolute left-0 top-full z-20 mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 shadow-sm"
        >
          Link copied!
        </span>
      )}
    </div>
  );
}
