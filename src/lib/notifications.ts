export interface WalletNotification {
  id: string;
  category: "invoice" | "lp" | "governance" | "reputation";
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export async function getNotifications(
  address: string,
): Promise<WalletNotification[]> {
  const apiBase = process.env.NOTIFICATION_API;

  if (!apiBase) {
    return [];
  }

  const res = await fetch(`${apiBase}/notifications/${address}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return res.json();
}
