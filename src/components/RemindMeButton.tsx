"use client";

import { useEffect, useMemo, useState } from "react";
import type { Invoice } from "@/utils/soroban";
import {
  getInvoiceReminderPreference,
  scheduleInvoiceReminder,
  setInvoiceReminderPreference,
} from "@/utils/invoiceReminders";

interface RemindMeButtonProps {
  invoice: Invoice;
  viewerAddress: string | null;
}

export default function RemindMeButton({ invoice, viewerAddress }: RemindMeButtonProps) {
  const [preference, setPreference] = useState<"enabled" | "denied" | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const isInvoiceParty = viewerAddress === invoice.payer || viewerAddress === invoice.freelancer;
  const canUseNotifications = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPreference(getInvoiceReminderPreference(invoice.id));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [invoice.id]);

  useEffect(() => {
    if (!canUseNotifications || preference !== "enabled") return;
    const timeoutId = scheduleInvoiceReminder(invoice);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [canUseNotifications, invoice, preference]);

  const shouldPrompt = useMemo(() => {
    if (!isInvoiceParty || !canUseNotifications || preference !== null) return false;
    return Notification.permission !== "denied";
  }, [canUseNotifications, isInvoiceParty, preference]);

  const enableReminder = async () => {
    if (!canUseNotifications) return;

    setIsRequesting(true);
    try {
      const permission = Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;

      if (permission === "granted") {
        setInvoiceReminderPreference(invoice.id, "enabled");
        setPreference("enabled");
      } else {
        setInvoiceReminderPreference(invoice.id, "denied");
        setPreference("denied");
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (preference === "enabled") {
    return (
      <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-primary">
        Reminder enabled: Invoice #{invoice.id.toString()} is due tomorrow.
      </div>
    );
  }

  if (!shouldPrompt) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-on-surface">
        Get notified 24 hours before this invoice expires?
      </p>
      <button
        onClick={() => void enableReminder()}
        disabled={isRequesting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">notifications_active</span>
        {isRequesting ? "Enabling..." : "Remind me"}
      </button>
    </div>
  );
}
