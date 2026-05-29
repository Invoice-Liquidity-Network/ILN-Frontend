"use client";

import { useEffect, useState } from "react";
import { getAllInvoices, getInvoiceCount, Invoice } from "@/utils/soroban";

const STATES = ["PENDING", "FUNDED", "PAID", "EXPIRED", "CANCELLED", "DISPUTED"];

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
        // Try to get total count from contract first
        try {
          const cnt = await getInvoiceCount();
          if (mounted) setTotal(Number(cnt));
        } catch {
          // ignore if unavailable
        }

        const invoices: Invoice[] = await getAllInvoices();
        const map: Record<string, number> = {};
        for (const s of STATES) map[s] = 0;
        for (const inv of invoices) {
          const status = String(inv.status ?? "").toUpperCase();
          map[status] = (map[status] || 0) + 1;
        }
        if (mounted) {
          setCounts(map);
          if (total === null) setTotal(Object.values(map).reduce((a, b) => a + b, 0));
        }
      } catch (e: any) {
        if (mounted) setError(e);
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
