'use client';

import { useContractEvents } from '@/hooks/useContractEvents';

/** Subscribes to Horizon contract transaction streams for live invoice updates.
 *  Issue #294: adds error recovery with exponential backoff and manual refresh.
 */
export default function ContractEventSync() {
  const { error, retryCount, refresh } = useContractEvents(true);

  if (!error) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-red-200 bg-red-50 p-4 shadow-lg flex flex-col gap-2"
    >
      <p className="text-sm font-semibold text-red-700">{error}</p>
      {retryCount > 0 && <p className="text-xs text-red-500">Retry attempt {retryCount} of 3</p>}
      <button
        onClick={refresh}
        className="mt-1 self-start rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors"
      >
        Refresh Now
      </button>
    </div>
  );
}
