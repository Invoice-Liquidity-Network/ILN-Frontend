"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (isOnline) {
      window.history.back();
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          {isOnline ? (
            <Wifi className="mx-auto h-16 w-16 text-primary" />
          ) : (
            <WifiOff className="mx-auto h-16 w-16 text-on-surface-variant" />
          )}
        </div>

        <h1 className="mb-4 font-headline text-2xl font-bold text-on-surface">
          {isOnline ? "Connection Restored" : "You're Offline"}
        </h1>

        <p className="mb-8 text-on-surface-variant">
          {isOnline
            ? "Your internet connection has been restored. You can now access all features."
            : "Some features may not be available while you're offline. You can still view cached invoices and your portfolio."}
        </p>

        <div className="space-y-4">
          {isOnline ? (
            <button
              onClick={handleRetry}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              Continue
            </button>
          ) : (
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
              <h3 className="mb-2 font-semibold text-on-surface">Available Offline:</h3>
              <ul className="space-y-1 text-sm text-on-surface-variant">
                <li>• View cached invoices</li>
                <li>• Check your LP portfolio</li>
                <li>• Browse watchlist</li>
                <li>• View earnings history</li>
              </ul>
            </div>
          )}

          <Link
            href="/"
            className="block w-full rounded-xl border border-outline-variant/30 bg-surface-container px-6 py-3 font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-8 text-xs text-on-surface-variant">
          <p>
            Status: <span className={isOnline ? "text-primary" : "text-error"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}