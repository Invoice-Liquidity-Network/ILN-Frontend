"use client";

import { useEffect, useState } from "react";
import { WifiOff, X } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false); // Reset dismissal when coming back online
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false); // Show banner when going offline
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-amber-900">
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">
            You're offline. Some features may not be available.
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="rounded p-1 text-amber-900 hover:bg-amber-600/20"
          aria-label="Dismiss offline banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}