import { describe, expect, it } from 'vitest';
import {
  getMetricProvenance,
  PROVENANCE_TIER_CONFIG,
  type ProvenanceTier,
} from '../data-provenance';
import { DATA_OWNERSHIP, type DataMetricKey } from '../data-ownership';

describe('Data Provenance Labels & Tiers (#1137)', () => {
  it('covers all 4 defined provenance tiers', () => {
    const tiers: ProvenanceTier[] = ['on-chain', 'indexed', 'cached', 'illustrative'];
    for (const t of tiers) {
      expect(PROVENANCE_TIER_CONFIG[t]).toBeDefined();
      expect(PROVENANCE_TIER_CONFIG[t].label.length).toBeGreaterThan(0);
      expect(PROVENANCE_TIER_CONFIG[t].badgeStyle.dot).toContain('bg-');
    }
  });

  it('correctly categorizes on-chain and indexed metrics', () => {
    const onChainProposals = getMetricProvenance('governance-proposals');
    expect(onChainProposals.tier).toBe('on-chain');
    expect(onChainProposals.label).toBe('On-Chain');
    expect(onChainProposals.source).toContain('Soroban');

    const indexedDefaultRate = getMetricProvenance('default-rate');
    expect(indexedDefaultRate.tier).toBe('indexed');
    expect(indexedDefaultRate.label).toBe('Indexed');
    expect(indexedDefaultRate.source).toContain('indexer');
  });

  it('marks cached data with cached tier', () => {
    const cachedStats = getMetricProvenance('contract-stats', true);
    expect(cachedStats.tier).toBe('cached');
    expect(cachedStats.label).toBe('Cached');
  });

  it('marks development fallback as illustrative', () => {
    const mockFeed = getMetricProvenance('funding-history', false, true);
    expect(mockFeed.tier).toBe('illustrative');
    expect(mockFeed.label).toBe('Illustrative');
  });

  it('maps every canonical metric in DATA_OWNERSHIP without runtime exception', () => {
    for (const key of Object.keys(DATA_OWNERSHIP) as DataMetricKey[]) {
      const details = getMetricProvenance(key);
      expect(details.tier).toBeDefined();
      expect(details.source).toBe(DATA_OWNERSHIP[key].source);
      expect(details.freshness).toBe(DATA_OWNERSHIP[key].freshness);
    }
  });
});
