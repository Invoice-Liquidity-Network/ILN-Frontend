/**
 * Extended contract-stats tests for uncovered branches:
 * - XLM token path in getTokenInfo (line 59-63)
 * - Unknown token fallback (line 63)
 * - else bucket.usdc fallback in buildHistoricalVolume (line 97-98)
 * - PartiallyFunded status counting
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildHistoricalVolume, get_contract_stats, TOKEN_COLORS } from '@/utils/contract-stats';
import type { Invoice } from '@/utils/soroban';

vi.mock('@/constants', () => ({
  CONTRACT_ID: 'CTEST',
  NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  TESTNET_USDC_TOKEN_ID: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
  TESTNET_EURC_TOKEN_ID: 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV',
  TESTNET_XLM_TOKEN_ID: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
}));

vi.mock('@/utils/soroban', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/soroban')>();
  return { ...actual, getAllInvoices: vi.fn() };
});

vi.mock('@/lib/fetch-protocol-contract-events', () => ({
  fetchProtocolContractEvents: vi.fn().mockResolvedValue([]),
}));

import { getAllInvoices } from '@/utils/soroban';

const XLM = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const USDC = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';
const recentTs = BigInt(Math.floor(Date.now() / 1000) - 86400);

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 1n,
    status: 'Pending',
    freelancer: 'G1',
    payer: 'G2',
    amount: 100_000_000n,
    due_date: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
    discount_rate: 250,
    token: USDC,
    ...overrides,
  };
}

describe('contract-stats – XLM token path', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calculates volume for XLM invoices', async () => {
    vi.mocked(getAllInvoices).mockResolvedValue([
      makeInvoice({
        id: 1n,
        status: 'Funded',
        token: XLM,
        amount: 10_000_000n,
        funded_at: recentTs,
      }),
    ]);
    const stats = await get_contract_stats();
    // 10_000_000 / 10^7 * 0.12 = 0.12
    expect(stats.total_volume_usd).toBeCloseTo(0.12, 1);
    const xlm = stats.volume_by_token.find((v) => v.symbol === 'XLM');
    expect(xlm!.amount_raw).toBeGreaterThan(0);
  });

  it('handles PartiallyFunded status as funded', async () => {
    vi.mocked(getAllInvoices).mockResolvedValue([
      makeInvoice({ id: 1n, status: 'PartiallyFunded', amount: 50_000_000n, funded_at: recentTs }),
    ]);
    const stats = await get_contract_stats();
    expect(stats.total_funded).toBe(1);
  });

  it('handles undefined token (defaults to USDC)', async () => {
    vi.mocked(getAllInvoices).mockResolvedValue([
      makeInvoice({
        id: 1n,
        status: 'Funded',
        token: undefined,
        amount: 100_000_000n,
        funded_at: recentTs,
      }),
    ]);
    const stats = await get_contract_stats();
    expect(stats.total_funded).toBe(1);
    const usdc = stats.volume_by_token.find((v) => v.symbol === 'USDC');
    expect(usdc!.amount_raw).toBeGreaterThan(0);
  });

  it('handles unknown token falling back to USDC symbol', async () => {
    vi.mocked(getAllInvoices).mockResolvedValue([
      makeInvoice({
        id: 1n,
        status: 'Funded',
        token: 'CUNKNOWNTOKEN',
        amount: 100_000_000n,
        funded_at: recentTs,
      }),
    ]);
    const stats = await get_contract_stats();
    expect(stats.total_funded).toBe(1);
  });
});

describe('buildHistoricalVolume – XLM and unknown token paths', () => {
  it('accumulates XLM volume into xlm bucket', () => {
    const invoices = [
      makeInvoice({ status: 'Funded', token: XLM, amount: 10_000_000n, funded_at: recentTs }),
    ];
    const buckets = buildHistoricalVolume(invoices, 7);
    const totalXlm = buckets.reduce((acc, b) => acc + b.xlm, 0);
    expect(totalXlm).toBeGreaterThan(0);
  });

  it('accumulates EURC volume into eurc bucket', () => {
    const EURC = 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV';
    const invoices = [
      makeInvoice({ status: 'Paid', token: EURC, amount: 10_000_000n, funded_at: recentTs }),
    ];
    const buckets = buildHistoricalVolume(invoices, 7);
    const totalEurc = buckets.reduce((acc, b) => acc + b.eurc, 0);
    expect(totalEurc).toBeGreaterThan(0);
  });

  it('accumulates unknown token into usdc bucket as fallback', () => {
    const invoices = [
      makeInvoice({
        status: 'Funded',
        token: 'CUNKNOWNTOKEN',
        amount: 10_000_000n,
        funded_at: recentTs,
      }),
    ];
    const buckets = buildHistoricalVolume(invoices, 7);
    const totalUsdc = buckets.reduce((acc, b) => acc + b.usdc, 0);
    expect(totalUsdc).toBeGreaterThan(0);
  });

  it('skips invoices without funded_at', () => {
    const invoices = [makeInvoice({ status: 'Funded', funded_at: undefined })];
    const buckets = buildHistoricalVolume(invoices, 7);
    const total = buckets.reduce((acc, b) => acc + b.volume_usd, 0);
    expect(total).toBe(0);
  });
});
