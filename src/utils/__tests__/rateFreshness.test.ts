import { describe, expect, it } from 'vitest';
import {
  evaluateRateFreshness,
  assertRateFreshness,
  StaleRateError,
  DEFAULT_RATE_MAX_AGE_MS,
} from '../rateFreshness';

describe('rateFreshness assertions (#1140)', () => {
  const now = 1700000000000;

  it('evaluates fresh rates within maxAge window', () => {
    const recent = now - 5 * 60 * 1000; // 5 mins ago
    const result = evaluateRateFreshness(recent, { now, maxAgeMs: 15 * 60 * 1000 });

    expect(result.isStale).toBe(false);
    expect(result.badgeTone).toBe('fresh');
    expect(result.statusText).toBe('Live');
    expect(() => assertRateFreshness(recent, { now })).not.toThrow();
  });

  it('marks rate as stale when exceeding threshold', () => {
    const stale = now - 20 * 60 * 1000; // 20 mins ago (default is 15 mins)
    const result = evaluateRateFreshness(stale, { now });

    expect(result.isStale).toBe(true);
    expect(result.badgeTone).toBe('stale');
    expect(result.statusText).toContain('Cached (20m ago)');

    expect(() => assertRateFreshness(stale, { now, metricName: 'DefaultRate' })).toThrow(
      StaleRateError
    );
  });

  it('marks rate as expired when age exceeds twice the threshold', () => {
    const expired = now - 45 * 60 * 1000; // 45 mins ago
    const result = evaluateRateFreshness(expired, { now });

    expect(result.isStale).toBe(true);
    expect(result.badgeTone).toBe('expired');
    expect(result.statusText).toContain('Expired');
  });

  it('handles ISO string timestamps correctly', () => {
    const isoDate = new Date(now - 60 * 1000).toISOString();
    const result = evaluateRateFreshness(isoDate, { now });

    expect(result.isStale).toBe(false);
    expect(result.badgeTone).toBe('fresh');
  });
});
