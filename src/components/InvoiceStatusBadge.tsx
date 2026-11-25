'use client';

import React, { useState, useEffect } from 'react';

export type CanonicalInvoiceStatus =
  | 'Pending'
  | 'Funded'
  | 'PartiallyFunded'
  | 'Paid'
  | 'Defaulted'
  | 'Cancelled'
  | 'Disputed';

const STATUS_SYNONYMS: Record<string, CanonicalInvoiceStatus> = {
  pending: 'Pending',
  open: 'Pending',
  created: 'Pending',
  funded: 'Funded',
  active: 'Funded',
  partiallyfunded: 'PartiallyFunded',
  partial: 'PartiallyFunded',
  partially_funded: 'PartiallyFunded',
  paid: 'Paid',
  settled: 'Paid',
  completed: 'Paid',
  defaulted: 'Defaulted',
  overdue: 'Defaulted',
  expired: 'Defaulted',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  disputed: 'Disputed',
  in_dispute: 'Disputed',
};

/**
 * Reconciles status from heterogeneous data sources (Soroban RPC, Indexer, Supabase)
 * into a single canonical enum.
 */
export function reconcileInvoiceStatus(rawStatus?: string | null): CanonicalInvoiceStatus {
  if (!rawStatus) return 'Pending';
  const normalized = rawStatus.toLowerCase().replace(/[\s-_]/g, '');
  return STATUS_SYNONYMS[normalized] || 'Pending';
}

interface InvoiceStatusBadgeProps {
  status: string;
}

const STATUS_STYLES: Record<CanonicalInvoiceStatus | string, string> = {
  Pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  Funded: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  PartiallyFunded: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200',
  Paid: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200',
  Defaulted: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
  Cancelled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  Disputed: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-200',
};

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const canonical = reconcileInvoiceStatus(status);
  const [currentStatus, setCurrentStatus] = useState<CanonicalInvoiceStatus>(canonical);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    const next = reconcileInvoiceStatus(status);
    if (next !== currentStatus) {
      setIsChanging(true);
      const timer = setTimeout(() => {
        setCurrentStatus(next);
        setIsChanging(false);
      }, 300); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [status, currentStatus]);

  const style =
    STATUS_STYLES[currentStatus] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold
        transition-all duration-300 ease-in-out
        ${style}
        ${isChanging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      `}
    >
      {currentStatus}
    </span>
  );
}
