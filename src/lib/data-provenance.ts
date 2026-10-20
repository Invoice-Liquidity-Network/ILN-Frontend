/**
 * Financial Metric Data Provenance Registry & Badging (#1137)
 *
 * Categorizes and displays whether a financial metric is on-chain,
 * indexed, cached, or illustrative, ensuring users understand the
 * authority and origin of every displayed number.
 */

import { type DataMetricKey, DATA_OWNERSHIP } from './data-ownership';

export type ProvenanceTier = 'on-chain' | 'indexed' | 'cached' | 'illustrative';

export interface ProvenanceDetails {
  tier: ProvenanceTier;
  label: string;
  source: string;
  freshness: string;
  description: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
}

export const PROVENANCE_TIER_CONFIG: Record<
  ProvenanceTier,
  { label: string; description: string; badgeStyle: ProvenanceDetails['badgeStyle'] }
> = {
  'on-chain': {
    label: 'On-Chain',
    description: 'Direct Soroban smart contract state read via authoritative RPC',
    badgeStyle: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
  },
  indexed: {
    label: 'Indexed',
    description: 'Aggregated historical event telemetry served by the ILN Indexer service',
    badgeStyle: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
  },
  cached: {
    label: 'Cached',
    description: 'Locally cached query response within valid freshness TTL window',
    badgeStyle: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
  },
  illustrative: {
    label: 'Illustrative',
    description: 'Synthetic demonstration fixture (development and test environments only)',
    badgeStyle: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500',
    },
  },
};

const METRIC_TO_TIER_MAP: Record<DataMetricKey, ProvenanceTier> = {
  'governance-proposals': 'on-chain',
  'voting-power': 'on-chain',
  'protocol-parameters': 'on-chain',
  'wallet-transaction-status': 'on-chain',
  'funding-history': 'indexed',
  'default-rate': 'indexed',
  'invoice-activity': 'indexed',
  'leaderboard': 'indexed',
  'contract-stats': 'indexed',
};

/**
 * Resolve provenance details for a given financial metric key.
 */
export function getMetricProvenance(
  metric: DataMetricKey,
  isCached = false,
  isDevMock = false,
): ProvenanceDetails {
  let tier: ProvenanceTier = METRIC_TO_TIER_MAP[metric] ?? 'indexed';

  if (isDevMock) {
    tier = 'illustrative';
  } else if (isCached) {
    tier = 'cached';
  }

  const baseConfig = PROVENANCE_TIER_CONFIG[tier];
  const ownership = DATA_OWNERSHIP[metric];

  return {
    tier,
    label: baseConfig.label,
    source: ownership?.source ?? 'Authoritative Protocol Service',
    freshness: ownership?.freshness ?? 'Real-time',
    description: baseConfig.description,
    badgeStyle: baseConfig.badgeStyle,
  };
}
