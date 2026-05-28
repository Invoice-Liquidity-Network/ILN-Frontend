import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  NotificationProvider,
  useNotification,
} from "../NotificationContext";

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: "GTESTWALLET123" }),
}));

describe("NotificationContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds notifications and tracks unread count", () => {
    const { result } = renderHook(() => useNotification(), {
      wrapper: NotificationProvider,
    });

    act(() => {
      result.current.addNotification({
        id: "invoice-1-paid",
        category: "invoice",
        type: "settled",
        title: "Invoice paid",
        message: "Invoice #1 was paid.",
        href: "/freelancer",
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it("persists read state by notification id", () => {
    const { result } = renderHook(() => useNotification(), {
      wrapper: NotificationProvider,
    });

    act(() => {
      result.current.addNotification({
        id: "gov-1",
        category: "governance",
        type: "proposal",
        title: "Proposal passed",
        message: "A proposal passed.",
        href: "/governance/1",
      });
    });

    act(() => {
      result.current.markAsRead("gov-1");
    });

    expect(result.current.isRead("gov-1")).toBe(true);
    expect(result.current.unreadCount).toBe(0);

    const readKey = "iln-notification-read:GTESTWALLET123";
    const stored = JSON.parse(localStorage.getItem(readKey) ?? "{}");
    expect(stored["gov-1"]).toBe(true);
  });

  it("marks all notifications as read", () => {
    const { result } = renderHook(() => useNotification(), {
      wrapper: NotificationProvider,
    });

    act(() => {
      result.current.addNotification({
        id: "a",
        category: "lp",
        type: "funded",
        title: "Funded",
        message: "Position funded",
        href: "/dashboard",
      });
      result.current.addNotification({
        id: "b",
        category: "reputation",
        type: "reputation",
        title: "Score change",
        message: "Reputation updated",
        href: "/freelancer",
      });
    });

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });
});
