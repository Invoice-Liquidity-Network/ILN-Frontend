'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const LPDashboardPage = dynamic(() => import('@/screens/LPDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-surface-container flex flex-col items-center justify-center text-on-surface-variant font-medium gap-3">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      Loading LP Dashboard...
    </div>
  ),
});

export default function LPRoutePage() {
  useDocumentTitle({ pageTitle: 'Liquidity Provider Dashboard' });

  return (
    <Suspense fallback={null}>
      <LPDashboardPage />
    </Suspense>
  );
}
