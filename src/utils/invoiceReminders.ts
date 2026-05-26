import type { Invoice } from "@/utils/soroban";

export type ReminderPreference = "enabled" | "denied";

export const REMINDER_ADVANCE_MS = 24 * 60 * 60 * 1000;

export function getInvoiceReminderKey(invoiceId: bigint): string {
  return `iln_invoice_reminder_${invoiceId.toString()}`;
}

export function getInvoiceReminderPreference(invoiceId: bigint): ReminderPreference | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(getInvoiceReminderKey(invoiceId));
  return value === "enabled" || value === "denied" ? value : null;
}

export function setInvoiceReminderPreference(invoiceId: bigint, preference: ReminderPreference): void {
  window.localStorage.setItem(getInvoiceReminderKey(invoiceId), preference);
}

export function getReminderDelayMs(invoice: Invoice, nowMs = Date.now()): number | null {
  const dueMs = Number(invoice.due_date) * 1000;
  if (!Number.isFinite(dueMs) || dueMs <= nowMs) return null;
  return Math.max(0, dueMs - REMINDER_ADVANCE_MS - nowMs);
}

export function scheduleInvoiceReminder(invoice: Invoice, nowMs = Date.now()): number | null {
  if (typeof window === "undefined" || typeof Notification === "undefined") return null;
  const delay = getReminderDelayMs(invoice, nowMs);
  if (delay === null) return null;

  return window.setTimeout(() => {
    if (Notification.permission === "granted") {
      new Notification(`Invoice #${invoice.id.toString()} is due tomorrow`);
    }
  }, delay);
}
