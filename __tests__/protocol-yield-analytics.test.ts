import { describe, it, expect } from 'vitest';
import type { Invoice } from '@/utils/soroban';
import {
  buildProtocolYieldTrend,
  computeProtocolYieldMetrics,
  effectiveYieldAnnualizedPct,
  getSettledInvoices,
} from '@/utils/protocol-yield-analytics';

const now = Math.floor(Date.now() / 1000);

function paidInvoice(overrides: Partial<Invoice> & { id: bigint }): Invoice {
  return {
    id: overrides.id,
    status: 'Paid',
    freelancer: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    payer: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRY',
    amount: 10_000_000_000n,
    due_date: BigInt(now + 30 * 86_400),
    discount_rate: 400,
    funder: 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC6',
    funded_at: BigInt(now - 10 * 86_400),
    token: 'token-usdc',
    ...overrides,
  };
}

describe('protocol-yield-analytics', () => {
  it('computes annualized effective yield from discount and tenure', () => {
    const inv = paidInvoice({ id: 1n });
    const yieldPct = effectiveYieldAnnualizedPct(inv);
    expect(yieldPct).toBeGreaterThan(0);
    expect(yieldPct).toBeLessThan(100);
  });

  it('filters settled invoices to paid with funded_at', () => {
    const invoices = [
      paidInvoice({ id: 1n }),
      paidInvoice({ id: 2n, status: 'Funded' }),
      paidInvoice({ id: 3n, funded_at: undefined }),
    ];
    expect(getSettledInvoices(invoices)).toHaveLength(1);
  });

  it('computes 30d average, median discount, and weekly extremes', () => {
    const invoices = [
      paidInvoice({ id: 1n, discount_rate: 200, funded_at: BigInt(now - 2 * 86_400) }),
      paidInvoice({
        id: 2n,
        discount_rate: 600,
        funded_at: BigInt(now - 3 * 86_400),
        token: 'token-eurc',
      }),
      paidInvoice({
        id: 3n,
        discount_rate: 400,
        funded_at: BigInt(now - 40 * 86_400),
      }),
    ];

    const metrics = computeProtocolYieldMetrics(invoices);
    expect(metrics.avgEffectiveYield30d).toBeGreaterThan(0);
    expect(metrics.medianDiscountRatePct).toBe(4);
    expect(metrics.highestThisWeek?.id).toBe('2');
    expect(metrics.lowestThisWeek?.id).toBe('1');
    expect(metrics.yieldByToken).toHaveLength(3);
  });

  it('builds 90-day yield trend series', () => {
    const invoices = [
      paidInvoice({ id: 10n, funded_at: BigInt(now - 5 * 86_400) }),
      paidInvoice({ id: 11n, funded_at: BigInt(now - 5 * 86_400) }),
    ];
    const trend = buildProtocolYieldTrend(invoices, 90);
    expect(trend.length).toBeGreaterThan(0);
    expect(trend[0]).toHaveProperty('avgYieldPct');
    expect(trend[0]).toHaveProperty('date');
  });
});
