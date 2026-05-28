"use client";

import { useNotification } from "@/context/NotificationContext";

type Props = {
  onClose: () => void;
};

export default function NotificationDrawer({ onClose }: Props) {
  const { notifications, markAsRead, markAllAsRead } = useNotification();

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const getStyle = (type: string) => {
    switch (type) {
      case "funded":
        return "text-green-600";
      case "settled":
        return "text-blue-600";
      case "expired":
        return "text-red-600";
      case "disputed":
        return "text-orange-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-slate-700";
    }
  };

  const orderedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="fixed right-0 top-0 z-50 w-96 h-full bg-white shadow-2xl p-4 overflow-y-auto dark:bg-slate-950">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Notification Centre</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Last 20 updates for your LP positions.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      <button
        type="button"
        onClick={handleMarkAllAsRead}
        className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Mark all as read
      </button>

      <div className="space-y-3">
        {orderedNotifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            No notifications yet.
          </div>
        ) : (
          orderedNotifications.slice(0, 20).map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleMarkAsRead(notification.id)}
              className={`w-full text-left rounded-2xl border p-4 transition ${
                notification.read
                  ? "border-slate-200 bg-slate-100 opacity-70 dark:border-slate-700 dark:bg-slate-900"
                  : "border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
              }`}
            >
              <p className={`text-sm font-semibold ${getStyle(notification.type)}`}>
                {notification.title}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {notification.message}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
