"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { formatAddress } from "@/utils/format";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to ILN",
    shortTitle: "Welcome",
    icon: "waving_hand",
    content: (
      <div className="space-y-4">
        <p>
          ILN connects freelancers who need liquidity with LPs who earn yield by funding invoices.
          As an LP, you browse pending invoices, assess payer risk, and fund positions that match your strategy.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Earn yield from invoice discount rates when invoices settle on time</li>
          <li>Track funded positions, claims, and portfolio performance in one dashboard</li>
          <li>Use risk badges and filters to focus on invoices that fit your appetite</li>
        </ul>
      </div>
    ),
  },
  {
    id: "wallet",
    title: "Connect your wallet",
    shortTitle: "Wallet",
    icon: "account_balance_wallet",
    content: null,
  },
  {
    id: "yield",
    title: "Understanding yield mechanics",
    shortTitle: "Yield",
    icon: "trending_up",
    content: (
      <div className="space-y-4">
        <p>
          Yield comes from the discount rate on each invoice. When you fund an invoice, you pay the discounted
          amount upfront and receive the full face value when the payer settles.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Example</p>
            <p className="mt-2 text-sm text-on-surface">
              Fund a $10,000 invoice at 5% discount → pay $9,500, receive $10,000 on settlement.
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Risk</p>
            <p className="mt-2 text-sm text-on-surface">
              Higher discount rates can mean higher returns, but review payer history and due dates before funding.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "funding",
    title: "Your first funding walkthrough",
    shortTitle: "Fund",
    icon: "payments",
    content: (
      <div className="space-y-4">
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">1</span>
            <span>Open the marketplace or Discovery tab to browse pending invoices.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">2</span>
            <span>Review payer risk, discount rate, due date, and estimated yield.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">3</span>
            <span>Click Fund, confirm token approval if prompted, and sign the transaction in your wallet.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">4</span>
            <span>Track your position under My Funded and monitor settlement in your portfolio.</span>
          </li>
        </ol>
      </div>
    ),
  },
] as const;

interface LPOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToMarketplace: () => void;
}

function WalletStepContent() {
  const { address, isConnected, isInstalled, connect } = useWallet();

  if (isConnected && address) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
          <span className="material-symbols-outlined text-green-600">check_circle</span>
          <div>
            <p className="text-sm font-semibold text-on-surface">Wallet connected</p>
            <p className="font-mono text-xs text-on-surface-variant">{formatAddress(address)}</p>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant">
          You are ready to fund invoices and manage your LP portfolio. Continue to learn how yield works.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-on-surface-variant">
        Connect a Stellar wallet to fund invoices, sign transactions, and view your LP positions.
        Freighter is the recommended wallet for ILN.
      </p>
      {!isInstalled ? (
        <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700">
          No compatible wallet detected. Install Freighter, then return here to connect.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void connect()}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-surface-container-lowest shadow-md transition-colors hover:bg-primary/90"
      >
        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
        Connect wallet
      </button>
    </div>
  );
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
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-[32px] border border-outline-variant/20 bg-surface-container-lowest p-8 text-left shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close LP onboarding"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant/80"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-on-surface-variant">LP onboarding</p>
          <h2 className="mt-3 font-headline text-3xl text-on-surface">Get started as a liquidity provider</h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Step {currentStepIndex + 1} of {STEPS.length}: {step.shortTitle}
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-label={`Onboarding progress: step ${currentStepIndex + 1} of ${STEPS.length}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEPS.map((item, index) => {
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-3 text-center transition-colors ${
                    isActive
                      ? "border-primary/40 bg-primary/5"
                      : isComplete
                        ? "border-primary/20 bg-primary-container/20"
                        : "border-surface-dim bg-surface-container-high"
                  }`}
                >
                  <div
                    className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      isActive
                        ? "bg-primary text-surface-container-lowest"
                        : isComplete
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    {isComplete ? (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Step {index + 1}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-on-surface">{item.shortTitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-surface-dim bg-surface-container-high p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">{step.icon}</span>
            <h3 className="text-xl font-bold text-on-surface">{step.title}</h3>
          </div>
          <div className="text-sm leading-6 text-on-surface-variant">
            {step.id === "wallet" ? <WalletStepContent /> : step.content}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold uppercase tracking-[0.24em] text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Skip onboarding
          </button>

          <div className="flex items-center gap-3">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
                className="rounded-full border border-outline-variant/60 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
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
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-surface-container-lowest shadow-md transition-colors hover:bg-primary/90"
            >
              {isLastStep ? "Go to Marketplace" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
