import { describe, it, expect } from 'vitest';
import type { ParsedContractEvent } from '@/lib/contract-events';
import {
  computeDisputeRateMetrics,
  getDisputeRateColor,
  getDisputeRateColorClasses,
} from '@/utils/dispute-rate';

const NOW = Date.parse('2025-06-15T12:00:00.000Z');

function fundedAt(iso: string): ParsedContractEvent {
  return { type: 'InvoiceFunded', createdAt: iso, invoiceId: 1n };
}

function disputedAt(iso: string): ParsedContractEvent {
  return { type: 'InvoiceDisputed', createdAt: iso, invoiceId: 2n };
}

describe('getDisputeRateColor', () => {
  it('returns green below 1%', () => {
    expect(getDisputeRateColor(0)).toBe('green');
    expect(getDisputeRateColor(0.99)).toBe('green');
  });

  it('returns amber from 1% through 5%', () => {
    expect(getDisputeRateColor(1)).toBe('amber');
    expect(getDisputeRateColor(3)).toBe('amber');
    expect(getDisputeRateColor(5)).toBe('amber');
  });

  it('returns red above 5%', () => {
    expect(getDisputeRateColor(5.01)).toBe('red');
    expect(getDisputeRateColor(10)).toBe('red');
  });
});

describe('getDisputeRateColorClasses', () => {
  it('maps each tone to display classes and sparkline stroke', () => {
    expect(getDisputeRateColorClasses('green').sparkline).toBe('#16a34a');
    expect(getDisputeRateColorClasses('amber').sparkline).toBe('#d97706');
    expect(getDisputeRateColorClasses('red').sparkline).toBe('#dc2626');
  });
});

describe('computeDisputeRateMetrics', () => {
  it('computes 30-day rate as disputed divided by funded events', () => {
    const events: ParsedContractEvent[] = [
      fundedAt('2025-06-10T00:00:00.000Z'),
      fundedAt('2025-06-11T00:00:00.000Z'),
      fundedAt('2025-06-12T00:00:00.000Z'),
      fundedAt('2025-06-13T00:00:00.000Z'),
      disputedAt('2025-06-14T00:00:00.000Z'),
    ];

    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.funded30d).toBe(4);
    expect(metrics.disputed30d).toBe(1);
    expect(metrics.rate30dPercent).toBeCloseTo(25, 5);
  });

  it('returns zero rate when no funded events in the last 30 days', () => {
    const metrics = computeDisputeRateMetrics([], NOW);
    expect(metrics.rate30dPercent).toBe(0);
    expect(metrics.funded30d).toBe(0);
    expect(metrics.disputed30d).toBe(0);
  });

  it('builds 90 daily trend points with per-day rates', () => {
    const events: ParsedContractEvent[] = [
      fundedAt('2025-06-01T00:00:00.000Z'),
      fundedAt('2025-06-01T12:00:00.000Z'),
      disputedAt('2025-06-01T18:00:00.000Z'),
    ];

    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.dailyTrend90d).toHaveLength(90);

    const june1 = metrics.dailyTrend90d.find((d) => d.date === '2025-06-01');
    expect(june1?.fundedCount).toBe(2);
    expect(june1?.disputedCount).toBe(1);
    expect(june1?.ratePercent).toBeCloseTo(50, 5);
  });

  it('excludes events older than 90 days from the trend', () => {
    const events: ParsedContractEvent[] = [fundedAt('2025-02-01T00:00:00.000Z')];
    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.funded30d).toBe(0);
    expect(metrics.dailyTrend90d.every((d) => d.fundedCount === 0)).toBe(true);
  });

  it('excludes future ledger timestamps from 30d totals and 90d buckets', () => {
    const events: ParsedContractEvent[] = [
      fundedAt('2025-06-15T12:00:00.000Z'), // exact nowMs (included)
      fundedAt('2025-06-15T12:00:00.001Z'), // 1ms in the future on same UTC day (excluded)
      disputedAt('2025-06-16T00:00:00.000Z'), // future day (excluded)
    ];

    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.funded30d).toBe(1);
    expect(metrics.disputed30d).toBe(0);
    expect(metrics.rate30dPercent).toBe(0);

    const today = metrics.dailyTrend90d.find((d) => d.date === '2025-06-15');
    expect(today?.fundedCount).toBe(1);
    expect(today?.disputedCount).toBe(0);
  });

  it('respects exact 30-day cutoff boundary', () => {
    const exact30dAgo = new Date(NOW - 30 * 86_400_000).toISOString();
    const justBefore30d = new Date(NOW - 30 * 86_400_000 - 1).toISOString();

    const events: ParsedContractEvent[] = [
      { type: 'InvoiceFunded', createdAt: exact30dAgo, invoiceId: 10n },
      { type: 'InvoiceFunded', createdAt: justBefore30d, invoiceId: 11n },
      { type: 'InvoiceDisputed', createdAt: exact30dAgo, invoiceId: 10n },
    ];

    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.funded30d).toBe(1);
    expect(metrics.disputed30d).toBe(1);
    expect(metrics.rate30dPercent).toBeCloseTo(100, 5);
  });

  it('deduplicates replayed events for the same (type, invoiceId)', () => {
    const events: ParsedContractEvent[] = [
      { type: 'InvoiceFunded', createdAt: '2025-06-10T00:00:00.000Z', invoiceId: 1n, ledger: 100 },
      { type: 'InvoiceFunded', createdAt: '2025-06-10T00:00:00.000Z', invoiceId: 1n, ledger: 100 },
      { type: 'InvoiceFunded', createdAt: '2025-06-11T00:00:00.000Z', invoiceId: 1n, ledger: 105 },
      { type: 'InvoiceDisputed', createdAt: '2025-06-12T00:00:00.000Z', invoiceId: 1n, ledger: 110 },
      { type: 'InvoiceDisputed', createdAt: '2025-06-12T00:00:00.000Z', invoiceId: 1n, ledger: 110 },
    ];

    const metrics = computeDisputeRateMetrics(events, NOW);
    expect(metrics.funded30d).toBe(1);
    expect(metrics.disputed30d).toBe(1);
    expect(metrics.rate30dPercent).toBeCloseTo(100, 5);
    // Higher ledger (105, June 11) should supersede ledger 100 (June 10)
    expect(metrics.dailyTrend90d.find((d) => d.date === '2025-06-10')?.fundedCount).toBe(0);
    expect(metrics.dailyTrend90d.find((d) => d.date === '2025-06-11')?.fundedCount).toBe(1);
  });
});
