"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo,
} from "react";

export type NotificationType =
  | "funded"
  | "settled"
  | "expired"
  | "disputed"
  | "info"
  | "warning";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (
    notification: Omit<NotificationItem, "id" | "createdAt" | "read">
  ) => NotificationItem;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearUnread: () => void;
}

const STORAGE_KEY = "iln-notifications";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch {
      // Ignore malformed storage data
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback(
    (notification: Omit<NotificationItem, "id" | "createdAt" | "read">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newNotification: NotificationItem = {
        id,
        createdAt: new Date().toISOString(),
        read: false,
        ...notification,
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
      return newNotification;
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({
      ...notification,
      read: true,
    })));
  }, []);

  const clearUnread = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        setNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearUnread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}