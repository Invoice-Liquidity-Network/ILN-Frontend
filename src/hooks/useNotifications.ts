"use client";

import { useState, useEffect, useCallback } from "react";

export type NotificationPermissionState = NotificationPermission | "loading";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>("loading");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("denied");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setPermission("denied");
      return "denied";
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    if (Notification.permission === "granted") {
      return new Notification(title, options);
    }
    return null;
  }, []);

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
}
