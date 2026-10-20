import { describe, expect, it } from 'vitest';
import { shouldUseDevMockFallback } from '@/components/IndexerUnavailableNotice';
import { verifyFinancialFallbackIntegrity } from '../financialFallbackPolicy';
import { DATA_OWNERSHIP } from '../data-ownership';

describe('Financial Display Fallback Correctness (#1138)', () => {
  it('disables mock fallback substitution in production mode', () => {
    const prevEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      expect(shouldUseDevMockFallback()).toBe(false);
    } finally {
      (process.env as any).NODE_ENV = prevEnv;
    }
  });

  it('verifies DefaultRateChart policy: surfaces honest notice on RPC/API failure without mock data', () => {
    const report = verifyFinancialFallbackIntegrity(
      'DefaultRateChart',
      'production',
      true, // hasError
      0,    // renderedDataCount (empty, no mock substituted)
      true, // honestNoticeEmitted
    );

    expect(report.status).toBe('COMPLIANT');
    expect(report.substitutedData).toBe(false);
    expect(report.honestNoticeEmitted).toBe(true);
  });

  it('detects and flags violations when plausible constants are fabricated in production', () => {
    const report = verifyFinancialFallbackIntegrity(
      'FundingChart',
      'production',
      true, // hasError
      10,   // renderedDataCount > 0 (violation: mock data injected during outage)
      false,
    );

    expect(report.status).toBe('VIOLATION');
    expect(report.substitutedData).toBe(true);
  });

  it('ensures all DATA_OWNERSHIP fallbacks specify honest unavailable semantics', () => {
    for (const [key, config] of Object.entries(DATA_OWNERSHIP)) {
      const fallback = config.fallback.toLowerCase();
      // Must not claim arbitrary fake numbers or silent constants
      expect(
        fallback.includes('none') ||
        fallback.includes('unavailable') ||
        fallback.includes('disabled') ||
        fallback.includes('not supported') ||
        fallback.includes('dev-only')
      ).toBe(true);
    }
  });
});
