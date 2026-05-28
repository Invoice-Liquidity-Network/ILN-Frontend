"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  useNotification,
  type NotificationItem,
} from "@/context/NotificationContext";
import { MAX_NOTIFICATIONS } from "@/utils/notificationHelpers";
import NotificationDrawer from "./NotificationDrawer";

interface ExternalNotification {
  id: string;
  category?: NotificationItem["category"];
  type: string;
  title: string;
  message: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

function mergeNotifications(
  existing: NotificationItem[],
  incoming: ExternalNotification[],
  isRead: (id: string) => boolean,
): NotificationItem[] {
  const map = new Map(existing.map((notification) => [notification.id, notification]));

  incoming.forEach((notification) => {
    const category =
      notification.category ??
      (notification.type === "proposal" ? "governance" : "invoice");
    const href = notification.href ?? "/dashboard";
    map.set(notification.id, {
      id: notification.id,
      category,
      type: notification.type as NotificationItem["type"],
      title: notification.title,
      message: notification.message,
      href,
      createdAt: notification.createdAt,
      read: isRead(notification.id) || notification.read,
    });
  });

  return Array.from(map.values())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, MAX_NOTIFICATIONS);
}

export default function NotificationBell() {
  const { address, isConnected } = useWallet();
  const {
    notifications,
    setNotifications,
    unreadCount,
    isRead,
  } = useNotification();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!address) return;

    let active = true;

    const fetchNotifications = async () => {
      const res = await fetch(`/api/notifications/${address}`);
      if (!active || !res.ok) return;

      const data = (await res.json()) as ExternalNotification[];
      const merged = mergeNotifications(notifications, data, isRead);
      setNotifications(merged);
    };

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [address, isRead, notifications, setNotifications]);

  if (!isConnected) return null;

  return (
    <div className="relative" data-tour="notifications-bell">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open notifications"
        aria-expanded={open}
        className="relative rounded-full p-2 hover:bg-surface-variant transition-colors"
      >
        <span className="material-symbols-outlined text-on-surface-variant">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error px-1.5 text-[10px] font-bold text-on-error">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationDrawer onClose={() => setOpen(false)} />}
    </div>
  );
}
