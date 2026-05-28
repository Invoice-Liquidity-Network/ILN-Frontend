"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useNotification, type NotificationItem } from "@/context/NotificationContext";
import NotificationDrawer from "./NotificationDrawer";

interface ExternalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

function mergeNotifications(
  existing: ExternalNotification[],
  incoming: ExternalNotification[],
): ExternalNotification[] {
  const map = new Map(existing.map((notification) => [notification.id, notification]));

  incoming.forEach((notification) => {
    const existingNotification = map.get(notification.id);
    map.set(notification.id, {
      ...notification,
      read: existingNotification?.read ?? notification.read,
    });
  });

  return Array.from(map.values())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 20);
}

export default function NotificationBell() {
  const { address } = useWallet();
  const {
    notifications,
    setNotifications,
    unreadCount,
    markAllAsRead,
  } = useNotification();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      if (!address) return;

      const res = await fetch(`/api/notifications/${address}`);
      if (!active || !res.ok) return;

      const data = (await res.json()) as ExternalNotification[];
      const merged = mergeNotifications(notifications as unknown as ExternalNotification[], data);
      setNotifications(merged as unknown as NotificationItem[]);
    };

    fetchNotifications();

    const interval = window.setInterval(fetchNotifications, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [address, setNotifications]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open notifications"
        className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDrawer
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
