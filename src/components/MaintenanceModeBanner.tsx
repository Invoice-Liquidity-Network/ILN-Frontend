'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISSAL_KEY = 'iln-maintenance-banner-dismissed';
const maintenanceModeEnabled = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

/**
 * A deployment-controlled banner for protocol-wide incidents. Dismissal lasts
 * only for the current browser session, so the notice remains visible across
 * navigation without hiding a continuing incident after a later visit.
 */
export default function MaintenanceModeBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(DISMISSAL_KEY) === 'true') {
      setDismissed(true);
    }
  }, []);

  if (!maintenanceModeEnabled || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-[70] border-b-2 border-amber-700/40 bg-amber-100 text-amber-950 shadow-lg dark:bg-amber-950 dark:text-amber-50"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Protocol maintenance in progress</p>
          <p className="mt-1 text-amber-900 dark:text-amber-100">
            Some ILN services may be unavailable or delayed while we investigate and restore the
            protocol. Please do not submit or sign new transactions until this notice is removed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.sessionStorage.setItem(DISMISSAL_KEY, 'true');
            setDismissed(true);
          }}
          className="rounded p-1 transition-colors hover:bg-amber-900/10 dark:hover:bg-amber-50/10"
          aria-label="Dismiss maintenance notice for this session"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
