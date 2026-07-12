'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const InvoicePdfButton = dynamic(() => import('./InvoicePdfButton'), {
  ssr: false,
  loading: () => (
    <button
      type="button"
      disabled
      className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container px-4 py-2.5 text-sm font-bold text-on-surface opacity-50"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading PDF...
    </button>
  ),
});

export default InvoicePdfButton;
