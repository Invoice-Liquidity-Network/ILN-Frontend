'use client';

import { Suspense } from 'react';
import CompareInvoicesScreen from '@/screens/CompareInvoices';

export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareInvoicesScreen />
    </Suspense>
  );
}
