"use client";

import type { Invoice } from "@/utils/soroban";

const STEPS = ["Pending", "Funded", "Paid"] as const;

function statusIndex(status: string): number {
  if (status === "Paid") return 2;
  if (status === "Funded" || status === "Disputed" || status === "Expired") return 1;
  return 0;
}

export default function InvoiceStatusTimeline({ invoice }: { invoice: Invoice }) {
  const currentIndex = statusIndex(invoice.status);

  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Invoice lifecycle status">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li
            key={step}
            className={`rounded-2xl border px-4 py-3 ${
              isCurrent
                ? "border-primary/40 bg-primary/10 text-primary"
                : isComplete
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600"
                  : "border-outline-variant/20 bg-surface-container-low text-on-surface-variant"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                {isComplete ? "check_circle" : isCurrent ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
              <span className="text-sm font-bold">{step}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
