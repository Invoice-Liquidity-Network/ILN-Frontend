"use client";

/**
 * Single-invoice lifecycle timeline: Pending → Funded → Paid, with the current
 * step highlighted. Terminal off-happy-path states (Cancelled, Defaulted) are
 * surfaced as a distinct final step rather than forced onto the linear track.
 *
 * Distinct from {@link InvoiceTimeline}, which groups many invoices by date for
 * the dashboard view.
 */

const HAPPY_PATH = ["Pending", "Funded", "Paid"] as const;
type HappyStep = (typeof HAPPY_PATH)[number];

interface InvoiceLifecycleTimelineProps {
  status: string;
}

/** Terminal states that replace the trailing step instead of advancing it. */
const TERMINAL_OVERRIDES: Record<string, { label: string; tone: "error" | "muted" }> = {
  Cancelled: { label: "Cancelled", tone: "muted" },
  Defaulted: { label: "Defaulted", tone: "error" },
  Disputed: { label: "Disputed", tone: "error" },
};

export default function InvoiceLifecycleTimeline({ status }: InvoiceLifecycleTimelineProps) {
  const override = TERMINAL_OVERRIDES[status];
  // For happy-path statuses, the active index is the status position. Funded is
  // a superset of Pending, Paid of Funded — so everything up to the index is done.
  const happyIndex = HAPPY_PATH.indexOf(status as HappyStep);
  // Cancelled/Defaulted occur after Pending (and possibly Funded); show the
  // earlier steps as completed and the terminal state as the final marker.
  const activeIndex = override ? HAPPY_PATH.length - 1 : happyIndex;

  const steps: { label: string; state: "done" | "current" | "upcoming"; tone: "primary" | "error" | "muted" }[] =
    HAPPY_PATH.map((step, index) => {
      const isLast = index === HAPPY_PATH.length - 1;
      const label = isLast && override ? override.label : step;
      const tone: "primary" | "error" | "muted" = isLast && override ? override.tone : "primary";

      let state: "done" | "current" | "upcoming";
      if (activeIndex < 0) {
        state = "upcoming";
      } else if (index < activeIndex) {
        state = "done";
      } else if (index === activeIndex) {
        state = "current";
      } else {
        state = "upcoming";
      }
      return { label, state, tone };
    });

  return (
    <ol className="flex items-center" aria-label="Invoice lifecycle status">
      {steps.map((step, index) => {
        const reached = step.state === "done" || step.state === "current";
        const dotColour =
          step.tone === "error"
            ? "bg-error text-on-error"
            : reached
              ? "bg-primary text-on-primary"
              : "bg-surface-container-high text-on-surface-variant";
        return (
          <li key={step.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={step.state === "current" ? "step" : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${dotColour}`}
              >
                {step.state === "done" ? "✓" : index + 1}
              </span>
              <span
                className={`text-xs font-bold ${reached ? "text-on-surface" : "text-on-surface-variant"}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span
                className={`mx-2 h-0.5 flex-1 rounded-full ${
                  index < activeIndex ? "bg-primary" : "bg-outline-variant/30"
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
