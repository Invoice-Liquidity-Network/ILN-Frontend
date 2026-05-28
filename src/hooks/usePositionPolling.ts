"use client";

import { useEffect, useRef } from "react";
import type { Invoice } from "@/utils/soroban";
import type { ToastMessage } from "@/context/ToastContext";
import type { NotificationItem } from "@/context/NotificationContext";
import { calculateYield, formatUSDC } from "@/utils/format";

interface PositionPollingOptions {
  invoices: Invoice[];
  address?: string | null;
  addToast: (toast: Omit<ToastMessage, "id">) => string;
  addNotification: (
    notification: Omit<NotificationItem, "createdAt" | "read"> & { id?: string },
  ) => NotificationItem;
}

interface PositionState {
  status: string;
  expiredNotified: boolean;
}

function formatYield(invoice: Invoice) {
  const yieldAmount = calculateYield(invoice.amount, invoice.discount_rate);
  return formatUSDC(yieldAmount);
}

function buildNotificationPayload(invoice: Invoice, type: NotificationItem["type"]) {
  const invoiceId = invoice.id.toString();
  const amount = formatYield(invoice);
  const base = {
    id: `lp-invoice-${invoiceId}-${type}`,
    category: "lp" as const,
    href: "/dashboard",
  };

  if (type === "settled") {
    return {
      ...base,
      type,
      title: `Invoice #${invoiceId} paid`,
      message: `Invoice #${invoiceId} settled. You earned ${amount} USDC.`,
    };
  }

  if (type === "expired") {
    return {
      ...base,
      type,
      title: `Invoice #${invoiceId} expired`,
      message: `Invoice #${invoiceId} has expired — no payout was received.`,
    };
  }

  if (type === "disputed") {
    return {
      ...base,
      type,
      title: `Invoice #${invoiceId} disputed`,
      message: `Invoice #${invoiceId} has been disputed and will need review.`,
    };
  }

  return {
    ...base,
    type,
    title: `Invoice #${invoiceId} updated`,
    message: `Invoice #${invoiceId} changed state to ${invoice.status}.`,
  };
}

export function usePositionPolling({
  invoices,
  address,
  addToast,
  addNotification,
}: PositionPollingOptions) {
  const previousStates = useRef<Map<string, PositionState>>(new Map());
  const invoicesRef = useRef<Invoice[]>(invoices);
  invoicesRef.current = invoices;

  const notify = (invoice: Invoice, type: NotificationItem["type"], toastType: ToastMessage["type"]) => {
    const payload = buildNotificationPayload(invoice, type);
    addToast({
      type: toastType,
      title: payload.title,
      message: payload.message,
    });
    addNotification(payload);
  };

  useEffect(() => {
    if (!address) return;

    const evaluateInvoices = (currentInvoices: Invoice[]) => {
      const fundedInvoices = currentInvoices.filter(
        (invoice) => invoice.funder === address,
      );

      fundedInvoices.forEach((invoice) => {
        const key = invoice.id.toString();
        const prevState = previousStates.current.get(key) ?? {
          status: invoice.status,
          expiredNotified: false,
        };

        const dueDateMillis = Number(invoice.due_date) * 1000;
        const isPastDue = dueDateMillis > 0 && dueDateMillis < Date.now();

        if (prevState.status === "Funded" && invoice.status === "Paid") {
          notify(invoice, "settled", "success");
        } else if (prevState.status === "Funded" && invoice.status === "Defaulted") {
          notify(invoice, "expired", "error");
        } else if (prevState.status === "Funded" && invoice.status === "Cancelled") {
          notify(invoice, "disputed", "error");
        } else if (
          invoice.status === "Funded" &&
          isPastDue &&
          !prevState.expiredNotified
        ) {
          notify(invoice, "expired", "error");
          prevState.expiredNotified = true;
        }

        previousStates.current.set(key, {
          status: invoice.status,
          expiredNotified: prevState.expiredNotified || false,
        });
      });
    };

    evaluateInvoices(invoicesRef.current);

    const interval = window.setInterval(() => {
      evaluateInvoices(invoicesRef.current);
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [address, addToast, addNotification]);
}
