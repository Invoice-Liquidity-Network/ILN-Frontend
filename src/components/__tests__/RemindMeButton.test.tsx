import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RemindMeButton from "../RemindMeButton";
import type { Invoice } from "@/utils/soroban";

const invoice: Invoice = {
  id: 24n,
  freelancer: "GFREELANCER",
  payer: "GPAYER",
  amount: 1000n,
  due_date: BigInt(Math.floor(Date.now() / 1000) + 48 * 60 * 60),
  discount_rate: 300,
  status: "Funded",
};

function installNotification(permission: NotificationPermission, requestPermission = vi.fn()) {
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: Object.assign(vi.fn(), { permission, requestPermission }),
  });
}

describe("RemindMeButton", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    installNotification("default", vi.fn().mockResolvedValue("granted"));
  });

  it("prompts invoice parties to opt into 24-hour due date reminders", () => {
    render(<RemindMeButton invoice={invoice} viewerAddress="GPAYER" />);

    expect(screen.getByText("Get notified 24 hours before this invoice expires?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remind me/i })).toBeInTheDocument();
  });

  it("does not prompt wallets that are not parties to the invoice", () => {
    render(<RemindMeButton invoice={invoice} viewerAddress="GOTHER" />);

    expect(screen.queryByText("Get notified 24 hours before this invoice expires?")).not.toBeInTheDocument();
  });

  it("stores enabled preference after granted permission", async () => {
    render(<RemindMeButton invoice={invoice} viewerAddress="GFREELANCER" />);

    fireEvent.click(screen.getByRole("button", { name: /remind me/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem("iln_invoice_reminder_24")).toBe("enabled");
    });
    expect(screen.getByText("Reminder enabled: Invoice #24 is due tomorrow.")).toBeInTheDocument();
  });

  it("stores denied preference and hides the prompt when permission is denied", async () => {
    installNotification("default", vi.fn().mockResolvedValue("denied"));
    render(<RemindMeButton invoice={invoice} viewerAddress="GPAYER" />);

    fireEvent.click(screen.getByRole("button", { name: /remind me/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem("iln_invoice_reminder_24")).toBe("denied");
    });
    expect(screen.queryByText("Get notified 24 hours before this invoice expires?")).not.toBeInTheDocument();
  });
});
