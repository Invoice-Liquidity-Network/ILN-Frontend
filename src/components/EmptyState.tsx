'use client';

import React from 'react';
import {
  FreelancerEmptyIllustration,
  LPDiscoveryEmptyIllustration,
  LPPortfolioEmptyIllustration,
  NotificationsEmptyIllustration,
} from './illustrations/EmptyIllustrations';

export type EmptyStateVariant =
  | 'wallet-disconnected'
  | 'no-invoices'
  | 'no-funded-positions'
  | 'empty-marketplace'
  | 'no-governance-proposals';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  action?: EmptyStateAction;
}

const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  {
    illustration: React.ComponentType<React.SVGProps<SVGSVGElement>> | null;
    icon: string | null;
    message: string;
  }
> = {
  'wallet-disconnected': {
    illustration: null,
    icon: 'account_balance_wallet',
    message: 'Connect your wallet to view your invoices',
  },
  'no-invoices': {
    illustration: FreelancerEmptyIllustration,
    icon: null,
    message: 'No invoices found',
  },
  'no-funded-positions': {
    illustration: LPPortfolioEmptyIllustration,
    icon: null,
    message: 'You have no funded positions yet',
  },
  'empty-marketplace': {
    illustration: LPDiscoveryEmptyIllustration,
    icon: null,
    message: 'No invoices available in the marketplace',
  },
  'no-governance-proposals': {
    illustration: NotificationsEmptyIllustration,
    icon: null,
    message: 'No governance proposals at this time',
  },
};

export function EmptyState({ variant, action }: EmptyStateProps) {
  const { illustration: Illustration, icon, message } = VARIANT_CONFIG[variant];

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      {Illustration ? (
        <div className="w-32 h-32">
          <Illustration />
        </div>
      ) : (
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 block">
          {icon}
        </span>
      )}

      <p className="text-on-surface-variant font-medium">{message}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
