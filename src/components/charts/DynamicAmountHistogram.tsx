'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const AmountHistogram = dynamic(() => import('./AmountHistogram'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl bg-surface-container">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading chart...</span>
      </div>
    </div>
  ),
});

export default AmountHistogram;
