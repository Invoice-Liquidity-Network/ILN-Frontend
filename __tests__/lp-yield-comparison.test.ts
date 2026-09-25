import { describe, it, expect } from 'vitest';
import type { Invoice } from '@/utils/soroban';
import { buildTokenYieldComparison, formatPremiumBps } from '@/utils/lp-yield-comparison';

const LP = 'GLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL';
const OTHER = 'GMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM';

const now = Math.floor(Date.now() / 1000);

function paid(id: bigint, funder: string, token: string, discount_rate: number): Invoice {
  return {
    id,
    status: 'Paid',
    freelancer: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    payer: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRY',
    amount: 5_000_000_000n,
    due_date: BigInt(now + 20 * 86_400),
    discount_rate,
    funder,
    funded_at: BigInt(now - 7 * 86_400),
    token,
  };
}

describe('lp-yield-comparison', () => {
  it('computes per-token LP, protocol, and T-bill comparison rows', () => {
    const invoices = [
      paid(1n, LP, 'token-usdc', 500),
      paid(2n, OTHER, 'token-usdc', 300),
      paid(3n, LP, 'token-eurc', 400),
    ];

    const rows = buildTokenYieldComparison(invoices, LP, 5);
    const usdc = rows.find((r) => r.symbol === 'USDC')!;
    expect(usdc.lpYieldPct).toBeGreaterThan(0);
    expect(usdc.protocolYieldPct).toBeGreaterThan(0);
    expect(usdc.tBillYieldPct).toBe(5);
    expect(usdc.premiumBps).toBe(Math.round((usdc.lpYieldPct - 5) * 100));
  });

  it('formats premium bps label', () => {
    expect(formatPremiumBps(125)).toBe('+125 bps over risk-free rate');
    expect(formatPremiumBps(-40)).toBe('-40 bps over risk-free rate');
  });
});
