import { describe, expect, it, vi } from "vitest";
import {
  getInvoiceReminderKey,
  getReminderDelayMs,
  scheduleInvoiceReminder,
} from "@/utils/invoiceReminders";
import type { Invoice } from "@/utils/soroban";

const invoice: Invoice = {
  id: 9n,
  freelancer: "GFREELANCER",
  payer: "GPAYER",
  amount: 1000n,
  due_date: 1_900_000_000n,
  discount_rate: 300,
  status: "Funded",
};

describe("invoice reminder helpers", () => {
  it("keys localStorage preferences by invoice ID", () => {
    expect(getInvoiceReminderKey(9n)).toBe("iln_invoice_reminder_9");
  });

  it("schedules reminders 24 hours before the due date", () => {
    const nowMs = Number(invoice.due_date) * 1000 - 30 * 60 * 60 * 1000;
    expect(getReminderDelayMs(invoice, nowMs)).toBe(6 * 60 * 60 * 1000);
  });

  it("does not schedule reminders for past-due invoices", () => {
    expect(getReminderDelayMs(invoice, Number(invoice.due_date) * 1000 + 1)).toBeNull();
  });

  it("fires the required browser notification message", () => {
    vi.useFakeTimers();
    const notification = vi.fn();
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: Object.assign(notification, { permission: "granted" }),
    });

    const nowMs = Number(invoice.due_date) * 1000 - 24 * 60 * 60 * 1000;
    scheduleInvoiceReminder(invoice, nowMs);
    vi.runOnlyPendingTimers();

    expect(notification).toHaveBeenCalledWith("Invoice #9 is due tomorrow");
    vi.useRealTimers();
  });
});
