"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";

const DISMISS_ANIMATION_MS = 250;

export default function OfflineBanner() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const updateConnectionState = () => {
      setIsVisible(!navigator.onLine);
    };

    updateConnectionState();

    const handleOnline = () => {
      setIsExiting(true);
      addToast({
        type: "success",
        title: "Back Online",
        message: "Connection restored. Syncing queued requests now.",
      });
      queryClient.resumePausedMutations();
      void queryClient.refetchQueries({ type: "active" });

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
      }, DISMISS_ANIMATION_MS);
    };

    const handleOffline = () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      setIsVisible(true);
      setIsExiting(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [addToast, queryClient]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 bg-amber-500/90 backdrop-blur-sm transition-all duration-300 ${
        isExiting ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-amber-900">
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">You&apos;re offline. Some features may not be available.</span>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = setTimeout(() => setIsVisible(false), DISMISS_ANIMATION_MS);
          }}
          className="rounded p-1 text-amber-900 transition-colors hover:bg-amber-600/20"
          aria-label="Dismiss offline banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
