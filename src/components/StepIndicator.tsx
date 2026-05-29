"use client";

interface StepIndicatorProps {
  steps: readonly string[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Invoice submission progress">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCurrent = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <li
            key={step}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              isCurrent
                ? "border-primary bg-primary/10 text-primary"
                : isComplete
                  ? "border-primary/30 bg-primary-container/40 text-on-primary-container"
                  : "border-outline-variant/15 bg-surface-container-low text-on-surface-variant"
            }`}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                isCurrent || isComplete
                  ? "bg-primary text-surface-container-lowest"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {isComplete ? (
                <span className="material-symbols-outlined text-[16px]">check</span>
              ) : (
                stepNumber
              )}
            </span>
            <span className="text-sm font-bold">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
