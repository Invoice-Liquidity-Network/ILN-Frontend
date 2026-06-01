"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    title: "How it works",
    content: (
      <>
        Learn how LP funding works in ILN: browse pending invoices, choose a discount rate that suits your strategy, and fund invoices to earn yield when they settle.
      </>
    ),
  },
  {
    title: "Understanding yield and risk",
    content: (
      <>
        Yield is determined by the invoice discount rate and how quickly the invoice pays. Higher returns often come with higher risk, so use the risk badge and invoice details before funding.
      </>
    ),
  },
  {
    title: "Try the marketplace",
    content: (
      <>
        Explore available invoices in the marketplace and get started funding. Read more in the <a href="https://docs.iln.finance" target="_blank" rel="noreferrer" className="text-primary underline">documentation</a>.
      </>
    ),
  },
] as const;

interface LPOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToMarketplace: () => void;
}

export default function LPOnboardingModal({ isOpen, onClose, onGoToMarketplace }: LPOnboardingModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isLastStep = currentStepIndex === STEPS.length - 1;
  const step = STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-[32px] border border-outline-variant/20 bg-surface-container-lowest shadow-2xl p-8 text-left">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close LP onboarding"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant/80"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-on-surface-variant">LP onboarding</p>
          <h2 className="mt-3 text-3xl font-headline text-on-surface">Welcome to the LP dashboard</h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            This quick tour explains how funding works, what you should watch for, and where to go next.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {STEPS.map((item, index) => (
            <div key={item.title} className="flex flex-col items-center gap-2 rounded-3xl border border-surface-dim bg-surface-container-high p-4 text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  index === currentStepIndex
                    ? "bg-primary text-surface-container-lowest"
                    : index < currentStepIndex
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-variant text-on-surface-variant"
                }`}
              >
                {index + 1}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">Step {index + 1}</p>
              <p className="text-sm font-semibold text-on-surface">{item.title}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-surface-dim bg-surface-container-high p-6 mb-6">
          <h3 className="text-xl font-bold text-on-surface mb-3">{step.title}</h3>
          <div className="text-sm leading-6 text-on-surface-variant">{step.content}</div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold uppercase tracking-[0.24em] text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Skip onboarding
          </button>

          <div className="flex items-center gap-3">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
                className="rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  onGoToMarketplace();
                } else {
                  setCurrentStepIndex((prev) => prev + 1);
                }
              }}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-surface-container-lowest shadow-md hover:bg-primary/90 transition-colors"
            >
              {isLastStep ? "Go to Marketplace" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
