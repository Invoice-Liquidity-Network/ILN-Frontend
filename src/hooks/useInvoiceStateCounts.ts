'use client';

import { useEffect, useState } from 'react';
import { getAllInvoices, Invoice } from '@/utils/soroban';

const STATES = ['PENDING', 'FUNDED', 'PAID', 'EXPIRED', 'CANCELLED', 'DISPUTED'] as const;

export interface ReconciledInvoiceStateCounts {
  counts: Record<string, number>;
  total: number;
}

/**
 * Reconcile invoice state counts from a single RPC `getAllInvoices` snapshot (#1280).
 *
 * - Deduplicates invoices by `id` when present so paginated or merged RPC
 *   results never double-count the same invoice.
 * - Never mixes a separate `getInvoiceCount()` call or stale indexer snapshot
 *   into `total`, guaranteeing `total === sum(counts)`.
 */
export function reconcileInvoiceStateCounts(invoices: Invoice[]): ReconciledInvoiceStateCounts {
  const map: Record<string, number> = {};
  for (const s of STATES) map[s] = 0;

  const seenIds = new Set<string>();
  const deduped: Invoice[] = [];

  for (const inv of invoices) {
    if (inv.id !== undefined && inv.id !== null) {
      const key = String(inv.id);
      if (seenIds.has(key)) continue;
      seenIds.add(key);
    }
    deduped.push(inv);
  }

  for (const inv of deduped) {
    const status = String(inv.status ?? '').trim().toUpperCase();
    if (!status) continue;
    map[status] = (map[status] || 0) + 1;
  }

  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return { counts: map, total };
}

/**
 * Fetches live RPC invoice state counts for `InvoiceStateDonut` (#1280).
 *
 * Data source: Direct Stellar RPC `getAllInvoices()` only (no indexer mixing).
 * Failure behavior: Sets `error` and leaves `counts` as `null` so the UI
 * renders an explicit unavailable state rather than zeroed/stale counts.
 */
export default function useInvoiceStateCounts() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const invoices: Invoice[] = await getAllInvoices();
        const reconciled = reconcileInvoiceStateCounts(invoices);
        if (mounted) {
          setCounts(reconciled.counts);
          setTotal(reconciled.total);
        }
      } catch (e: unknown) {
        if (mounted) {
          setError(e instanceof Error ? e : new Error('Failed to load invoice state counts'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { counts, total, loading, error } as const;
}
