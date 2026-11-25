'use client';

import { useRef, useState, KeyboardEvent } from 'react';

/**
 * Single-invoice lifecycle timeline: Pending → Funded → Paid, with the current
 * step highlighted.
 *
 * Supported contract states:
 * - Nonterminal: `Pending`, `PartiallyFunded` (replaces step 2 label with
 *   "Partially Funded"), `Funded`.
 * - Terminal happy-path: `Paid`.
 * - Terminal / off-happy-path: `Cancelled` (Pending done, Funded skipped/upcoming,
 *   final step "Cancelled"), `Defaulted` (Pending & Funded done, final step
 *   "Defaulted"), `Disputed` (Pending & Funded done, final step "Disputed").
 *
 * Failure behavior:
 * - Unknown, empty, or unrecognized `status` values fail visibly with a
 *   `role="alert"` notice instead of silently rendering an all-upcoming track.
 * - Residual risk: `Disputed` is modeled as a terminal override on the 3-step
 *   track even though on-chain disputes can later resolve; if a `Resolved`
 *   state is added to the contract, it must be mapped here explicitly.
 *
 * Distinct from {@link InvoiceTimeline}, which groups many invoices by date for
 * the dashboard view.
 */

const HAPPY_PATH = ['Pending', 'Funded', 'Paid'] as const;
type HappyStep = (typeof HAPPY_PATH)[number];

interface InvoiceLifecycleTimelineProps {
  status: string;
}

interface OverrideConfig {
  label: string;
  tone: 'error' | 'muted';
  /** Whether the invoice passed through the Funded step prior to this state. */
  wasFunded: boolean;
}

/** Terminal / off-happy-path states that replace the trailing step. */
const TERMINAL_OVERRIDES: Record<string, OverrideConfig> = {
  Cancelled: { label: 'Cancelled', tone: 'muted', wasFunded: false },
  Defaulted: { label: 'Defaulted', tone: 'error', wasFunded: true },
  Disputed: { label: 'Disputed', tone: 'error', wasFunded: true },
};

export default function InvoiceLifecycleTimeline({ status }: InvoiceLifecycleTimelineProps) {
  const normalizedStatus = typeof status === 'string' ? status.trim() : '';
  const override = TERMINAL_OVERRIDES[normalizedStatus];
  const isPartiallyFunded = normalizedStatus === 'PartiallyFunded';
  const happyIndex = isPartiallyFunded
    ? 1
    : HAPPY_PATH.indexOf(normalizedStatus as HappyStep);
  const isKnownStatus = Boolean(override) || happyIndex >= 0;

  // Hooks must run unconditionally before any early return.
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  if (!isKnownStatus) {
    return (
      <div
        role="alert"
        aria-label="Invoice lifecycle status"
        className="inline-flex items-center gap-2 rounded-lg border border-error/40 bg-error-container/60 px-3 py-2 text-xs font-semibold text-on-error-container"
      >
        <span aria-hidden="true">!</span>
        <span>Unknown invoice status: {normalizedStatus || 'None'}</span>
      </div>
    );
  }

  // For happy-path statuses, everything up to activeIndex is done.
  // For terminal overrides, step 0 (Pending) is always done, step 1 (Funded) is
  // done only when `wasFunded` is true, and step 2 is the terminal state.
  const activeIndex = override ? HAPPY_PATH.length - 1 : happyIndex;

  const steps: {
    label: string;
    state: 'done' | 'current' | 'upcoming';
    tone: 'primary' | 'error' | 'muted';
  }[] = HAPPY_PATH.map((step, index) => {
    const isLast = index === HAPPY_PATH.length - 1;
    const label =
      isLast && override
        ? override.label
        : index === 1 && isPartiallyFunded
          ? 'Partially Funded'
          : step;
    const tone: 'primary' | 'error' | 'muted' = isLast && override ? override.tone : 'primary';

    let state: 'done' | 'current' | 'upcoming';
    if (override) {
      if (index === 0) {
        state = 'done';
      } else if (index === 1) {
        state = override.wasFunded ? 'done' : 'upcoming';
      } else {
        state = 'current';
      }
    } else if (index < activeIndex) {
      state = 'done';
    } else if (index === activeIndex) {
      state = 'current';
    } else {
      state = 'upcoming';
    }
    return { label, state, tone };
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number) => {
    let nextIndex = index;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % steps.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + steps.length) % steps.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = steps.length - 1;
    }

    if (nextIndex !== index) {
      setFocusedIndex(nextIndex);
      itemRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <ol className="flex items-center" aria-label="Invoice lifecycle status" role="list">
      {steps.map((step, index) => {
        const reached = step.state === 'done' || step.state === 'current';
        const dotColour =
          step.tone === 'error'
            ? 'bg-error text-on-error'
            : step.tone === 'muted'
              ? 'bg-surface-container-highest text-on-surface-variant'
              : reached
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant';

        return (
          <li key={step.label} className="flex flex-1 items-center last:flex-none" role="listitem">
            <div
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              className="flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest rounded-lg p-1"
              tabIndex={index === focusedIndex ? 0 : -1}
              onFocus={() => setFocusedIndex(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-current={step.state === 'current' ? 'step' : undefined}
            >
              <span className="sr-only">
                {step.state === 'done'
                  ? 'Completed step: '
                  : step.state === 'current'
                    ? 'Current step: '
                    : 'Upcoming step: '}
                Invoice {step.label.toLowerCase()}
              </span>
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${dotColour}`}
              >
                {step.state === 'done' ? '✓' : index + 1}
              </span>
              <span
                aria-hidden="true"
                className={`text-xs font-bold ${
                  reached ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span
                className={`mx-2 h-0.5 flex-1 rounded-full ${
                  step.state === 'done' && steps[index + 1].state !== 'upcoming'
                    ? 'bg-primary'
                    : 'bg-outline-variant/30'
                }`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
