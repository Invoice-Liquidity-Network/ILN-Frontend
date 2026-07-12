'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchInvoiceNftState, type InvoiceNftState } from '@/lib/invoice-nft';

export function useInvoiceNft(invoiceId: bigint, enabled: boolean) {
  const [state, setState] = useState<InvoiceNftState | null>(null);
  const [loading, setLoading] = useState(enabled);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const next = await fetchInvoiceNftState(invoiceId);
      setState(next);
    } finally {
      setLoading(false);
    }
  }, [enabled, invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, loading, reload: load };
}
