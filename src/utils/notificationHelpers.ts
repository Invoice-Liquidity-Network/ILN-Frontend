import type { NotificationCategory, NotificationType } from "@/context/NotificationContext";

export const MAX_NOTIFICATIONS = 50;

export function notificationsStorageKey(walletAddress: string) {
  return `iln-notifications:${walletAddress}`;
}

export function readStateStorageKey(walletAddress: string) {
  return `iln-notification-read:${walletAddress}`;
}

export function formatTimeAgo(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

export function getNotificationIcon(
  category: NotificationCategory,
  type: NotificationType,
): string {
  if (category === "governance") return "how_to_vote";
  if (category === "reputation") return "military_tech";
  if (category === "lp") return "account_balance";
  if (type === "settled" || type === "funded") return "paid";
  if (type === "expired") return "schedule";
  if (type === "disputed") return "gavel";
  if (type === "warning") return "warning";
  return "receipt_long";
}

export function getNotificationAccentClass(type: NotificationType): string {
  switch (type) {
    case "funded":
    case "settled":
      return "text-green-600 dark:text-green-400";
    case "expired":
      return "text-red-600 dark:text-red-400";
    case "disputed":
      return "text-orange-600 dark:text-orange-400";
    case "warning":
      return "text-amber-600 dark:text-amber-400";
    default:
      return "text-primary";
  }
}
