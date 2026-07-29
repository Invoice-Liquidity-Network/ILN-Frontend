import { describe, expect, it } from 'vitest';
import {
  buildDailyActivityCounts,
  buildHeatmapGrid,
  deriveAddressActivityFromInvoices,
  formatActivityTooltip,
  getHeatmapIntensityColor,
  type DayActivity,
} from '@/utils/activity-heatmap';
import type { Invoice } from '@/utils/soroban';

describe('activity-heatmap', () => {
  describe('buildDailyActivityCounts', () => {
    it('aggregates daily counts for address activity', () => {
      const now = Date.parse('2025-05-01T12:00:00Z');
      const counts = buildDailyActivityCounts(
        [
          { type: 'submit', timestampMs: Date.parse('2025-04-30T10:00:00Z') },
          { type: 'fund', timestampMs: Date.parse('2025-04-30T15:00:00Z') },
        ],
        now
      );

      expect(counts.get('2025-04-30')?.count).toBe(2);
    });

    it('sums amounts from all actions on the same day', () => {
      const now = Date.parse('2025-05-01T12:00:00Z');
      const counts = buildDailyActivityCounts(
        [
          { type: 'submit', timestampMs: Date.parse('2025-04-30T10:00:00Z'), amount: 100n },
          { type: 'fund', timestampMs: Date.parse('2025-04-30T15:00:00Z'), amount: 200n },
        ],
        now
      );

      expect(counts.get('2025-04-30')?.totalAmount).toBe(300n);
    });

    it('defaults totalAmount to 0n when amount is not provided', () => {
      const now = Date.parse('2025-05-01T12:00:00Z');
      const counts = buildDailyActivityCounts(
        [{ type: 'submit', timestampMs: Date.parse('2025-04-30T10:00:00Z') }],
        now
      );

      expect(counts.get('2025-04-30')?.totalAmount).toBe(0n);
    });

    it('excludes activity outside the 52-week window', () => {
      const now = Date.parse('2025-05-01T12:00:00Z');
      const counts = buildDailyActivityCounts(
        [{ type: 'submit', timestampMs: Date.parse('2020-01-01T00:00:00Z') }],
        now
      );

      expect(counts.size).toBe(0);
    });
  });

  describe('deriveAddressActivityFromInvoices', () => {
    it('derives submit, fund, and paid actions from invoices', () => {
      const invoices: Invoice[] = [
        {
          id: 1n,
          status: 'Paid',
          freelancer: 'GADDR',
          payer: 'GOTHER',
          funder: 'GADDR',
          amount: 1n,
          due_date: 1_700_000_000n,
          discount_rate: 1,
          funded_at: 1_700_000_000n,
        },
      ];

      const activity = deriveAddressActivityFromInvoices(invoices, 'GADDR');
      expect(activity.length).toBeGreaterThanOrEqual(2);
    });

    it('includes invoice amount in derived activity records', () => {
      const invoices: Invoice[] = [
        {
          id: 1n,
          status: 'Funded',
          freelancer: 'GADDR',
          payer: 'GPAYER',
          funder: 'GLP',
          amount: 500n,
          due_date: 1_700_000_000n,
          discount_rate: 0,
          funded_at: 1_700_000_000n,
        },
      ];

      const activity = deriveAddressActivityFromInvoices(invoices, 'GADDR');
      expect(activity.every((a) => a.amount === 500n)).toBe(true);
    });
  });

  describe('buildHeatmapGrid', () => {
    it('returns 52 weeks of 7 days each', () => {
      const { weeks } = buildHeatmapGrid(new Map());
      expect(weeks).toHaveLength(52);
      expect(weeks[0]).toHaveLength(7);
    });

    it('exposes dayActivity map with counts per day', () => {
      const now = Date.parse('2025-05-01T12:00:00Z');
      const activity: DayActivity = { count: 3, totalAmount: 600n };
      const map = new Map([['2025-04-30', activity]]);
      const { dayActivity } = buildHeatmapGrid(map, now);

      expect(dayActivity.get('2025-04-30')).toEqual(activity);
    });
  });

  describe('formatActivityTooltip', () => {
    it('formats tooltip with count', () => {
      expect(formatActivityTooltip({ count: 3, totalAmount: 0n }, '2025-04-30')).toContain(
        '3 actions'
      );
    });

    it('uses singular "1 action" for a single event', () => {
      expect(formatActivityTooltip({ count: 1, totalAmount: 0n }, '2025-04-30')).toContain(
        '1 action'
      );
      expect(formatActivityTooltip({ count: 1, totalAmount: 0n }, '2025-04-30')).not.toContain(
        '1 actions'
      );
    });

    it('shows "No activity" for zero count', () => {
      expect(formatActivityTooltip({ count: 0, totalAmount: 0n }, '2025-04-30')).toContain(
        'No activity'
      );
    });

    it('includes total amount when non-zero', () => {
      const label = formatActivityTooltip({ count: 2, totalAmount: 1_000_000_000n }, '2025-04-30');
      expect(label).toContain('total');
    });

    it('omits amount when totalAmount is zero', () => {
      const label = formatActivityTooltip({ count: 2, totalAmount: 0n }, '2025-04-30');
      expect(label).not.toContain('total');
    });
  });

  describe('getHeatmapIntensityColor', () => {
    it('returns empty color for zero count', () => {
      expect(getHeatmapIntensityColor(0, 5)).toBe('#ebedf0');
    });

    it('returns darkest color for max count', () => {
      expect(getHeatmapIntensityColor(5, 5)).toBe('#216e39');
    });
  });
});
