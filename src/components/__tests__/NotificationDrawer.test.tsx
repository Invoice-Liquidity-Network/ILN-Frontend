import { useEffect } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import NotificationDrawer from "../NotificationDrawer";
import {
  NotificationProvider,
  useNotification,
} from "@/context/NotificationContext";

vi.mock("@/context/WalletContext", () => ({
  useWallet: () => ({ address: "GTESTWALLET123" }),
}));

function SeedNotifications() {
  const { addNotification } = useNotification();
  useEffect(() => {
    addNotification({
      id: "invoice-42-settled",
      category: "invoice",
      type: "settled",
      title: "Invoice #42 settled",
      message: "Payment received.",
      href: "/freelancer",
    });
  }, [addNotification]);
  return null;
}

describe("NotificationDrawer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders notification items with mark all as read", () => {
    render(
      <NotificationProvider>
        <SeedNotifications />
        <NotificationDrawer onClose={vi.fn()} />
      </NotificationProvider>,
    );

    expect(screen.getByText("Invoice #42 settled")).toBeInTheDocument();
    expect(screen.getByText("Mark all as read")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Invoice #42 settled/i })).toHaveAttribute(
      "href",
      "/freelancer",
    );
  });

  it("marks a notification as read when clicked", () => {
    render(
      <NotificationProvider>
        <SeedNotifications />
        <NotificationDrawer onClose={vi.fn()} />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole("link", { name: /Invoice #42 settled/i }));
    const readKey = "iln-notification-read:GTESTWALLET123";
    const stored = JSON.parse(localStorage.getItem(readKey) ?? "{}");
    expect(stored["invoice-42-settled"]).toBe(true);
  });
});
