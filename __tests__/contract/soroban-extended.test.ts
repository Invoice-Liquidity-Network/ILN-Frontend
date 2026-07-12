/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockServer, mockTx, mockAssembledTx } = vi.hoisted(() => {
  const mockTx: any = {
    toEnvelope: vi.fn(() => ({ toXDR: () => 'xdr' })),
    toXDR: vi.fn(() => 'txXDR'),
  };
  const mockAssembledTx: any = { build: vi.fn(() => mockTx) };
  const mockServer: any = {
    getHealth: vi.fn(() => Promise.resolve({ status: 'healthy' })),
    simulateTransaction: vi.fn(() => Promise.resolve({ result: { retval: {} } })),
    getAccount: vi.fn(() =>
      Promise.resolve({
        accountId: () => 'GAAA',
        incrementSequenceNumber: vi.fn(),
        sequenceNumber: () => '100',
      })
    ),
    sendTransaction: vi.fn(() => Promise.resolve({ status: 'PENDING', hash: 'txhash123' })),
    getTransaction: vi.fn(() => Promise.resolve({ status: 'SUCCESS' })),
    getLatestLedger: vi.fn(() => Promise.resolve({ sequence: 100000 })),
    prepareTransaction: vi.fn(() => Promise.resolve(mockTx)),
    pollTransaction: vi.fn(() => Promise.resolve({ status: 'SUCCESS' })),
  };
  return { mockServer, mockTx, mockAssembledTx };
});

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar/stellar-sdk')>();
  return {
    ...actual,
    rpc: {
      Server: function () {
        return mockServer;
      },
      Api: {
        isSimulationSuccess: vi.fn((r: any) => !!r?.result),
        GetTransactionStatus: { SUCCESS: 'SUCCESS' },
      },
      assembleTransaction: vi.fn(() => mockAssembledTx),
    },
    scValToNative: vi.fn((val: any) => val),
    nativeToScVal: vi.fn((_v: any, _o?: any) => ({ _arm: 'mock' })),
    Address: {
      fromString: vi.fn((_a: string) => ({
        toScVal: vi.fn(() => ({ _arm: 'address' })),
        toScAddress: vi.fn(() => ({})),
      })),
    },
    TransactionBuilder: Object.assign(
      vi.fn(function (this: any) {
        this.addOperation = vi.fn().mockReturnThis();
        this.setTimeout = vi.fn().mockReturnThis();
        this.build = vi.fn(() => mockTx);
      }),
      { fromXDR: vi.fn(() => mockTx) }
    ),
    Operation: {
      invokeHostFunction: vi.fn(() => ({})),
      invokeContractFunction: vi.fn(() => ({})),
    },
    Contract: vi.fn(function (this: any) {
      this.call = vi.fn(() => ({}));
    }),
    Account: vi.fn(function (this: any, addr: string) {
      this.accountId = () => addr;
      this.incrementSequenceNumber = vi.fn();
      this.sequenceNumber = () => '100';
    }),
    BASE_FEE: '100',
    xdr: actual.xdr,
  };
});

vi.mock('@/constants', () => ({
  CONTRACT_ID: 'CCONTRACTIDTEST000000000000000000000000000000000000000000',
  NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  RPC_URL: 'https://soroban-testnet.stellar.org',
  TESTNET_USDC_TOKEN_ID: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
  TESTNET_EURC_TOKEN_ID: 'CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV',
  TESTNET_XLM_TOKEN_ID: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
}));

vi.mock('@/utils/invoiceSubmission', () => ({
  parseAmountToUnits: vi.fn((v: string) => BigInt(Math.floor(parseFloat(v) * 1e6))),
  parseDiscountRateToBps: vi.fn((v: number) => Math.round(v * 100)),
  toUnixTimestamp: vi.fn((d: string) => Math.floor(new Date(d).getTime() / 1000)),
}));

vi.mock('@/lib/horizonClient', () => ({
  fetchNativeXlmBalance: vi.fn(() => Promise.resolve(100.5)),
}));

import {
  getAllInvoices,
  getWalletRoles,
  getNativeXlmBalance,
  getUsdcBalance,
  getTokenAllowance,
  approveToken,
  getUsdcAllowance,
  appealDefault,
  disputeInvoice,
  updateLPWhitelist,
  claimDefault,
  updateInvoice,
  getReferralStats,
  submitInvoiceTransaction,
  buildApproveTokenTransaction,
  buildApproveUsdcTransaction,
  submitSignedTransaction,
  convertInvoiceToken,
  getInsurancePoolInfo,
  getLPInsuranceStatus,
  depositPremium,
  claimInsurance,
  getReputation,
  getReputationEvents,
  getPayerScoresBatch,
  getTopPayers,
  getInvoice,
  getInvoiceCount,
  submitInvoicesBatch,
} from '@/utils/soroban';
import { rpc, scValToNative } from '@stellar/stellar-sdk';

const ADDR = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const USDC = 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75';

function setupSuccess(retval: any = {}) {
  vi.clearAllMocks();
  (rpc.Api.isSimulationSuccess as any).mockReturnValue(true);
  (rpc.assembleTransaction as any).mockReturnValue(mockAssembledTx);
  (scValToNative as any).mockReturnValue(retval);
  mockServer.simulateTransaction.mockResolvedValue({ result: { retval } });
  mockServer.getAccount.mockResolvedValue({
    accountId: () => ADDR,
    incrementSequenceNumber: vi.fn(),
    sequenceNumber: () => '100',
  });
  mockServer.getHealth.mockResolvedValue({ status: 'healthy' });
  mockServer.getLatestLedger.mockResolvedValue({ sequence: 100000 });
  mockServer.prepareTransaction.mockResolvedValue(mockTx);
  mockServer.pollTransaction.mockResolvedValue({ status: 'SUCCESS' });
  mockServer.sendTransaction.mockResolvedValue({ status: 'PENDING', hash: 'h123' });
}

describe('soroban – getAllInvoices', () => {
  beforeEach(() => setupSuccess());

  it('returns invoices until consecutive failure', async () => {
    const inv = {
      id: 1n,
      status: { Pending: null },
      freelancer: ADDR,
      payer: ADDR,
      amount: 100n,
      due_date: 1n,
      discount_rate: 100,
    };
    (scValToNative as any).mockReturnValueOnce(inv);
    (rpc.Api.isSimulationSuccess as any).mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockServer.simulateTransaction
      .mockResolvedValueOnce({ result: { retval: {} } })
      .mockResolvedValueOnce({ error: 'not found' });
    const invoices = await getAllInvoices();
    expect(Array.isArray(invoices)).toBe(true);
  });
});

describe('soroban – getWalletRoles', () => {
  it('identifies freelancer role', async () => {
    const inv = {
      id: 1n,
      status: { Pending: null },
      freelancer: ADDR,
      payer: 'OTHER',
      amount: 100n,
      due_date: 1n,
      discount_rate: 100,
    };
    (scValToNative as any).mockReturnValueOnce(inv);
    (rpc.Api.isSimulationSuccess as any).mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockServer.simulateTransaction
      .mockResolvedValueOnce({ result: { retval: {} } })
      .mockResolvedValueOnce({ error: 'fail' });
    const roles = await getWalletRoles(ADDR);
    expect(roles).toContain('freelancer');
  });
});

describe('soroban – getNativeXlmBalance', () => {
  it('returns XLM balance', async () => {
    const bal = await getNativeXlmBalance(ADDR);
    expect(typeof bal).toBe('number');
  });
});

describe('soroban – getUsdcBalance', () => {
  beforeEach(() => setupSuccess(1000000n));
  it('delegates to getTokenBalance', async () => {
    const bal = await getUsdcBalance(ADDR);
    expect(typeof bal).toBe('bigint');
  });
});

describe('soroban – getTokenAllowance', () => {
  beforeEach(() => setupSuccess(500n));
  it('returns allowance as bigint', async () => {
    const a = await getTokenAllowance({ owner: ADDR });
    expect(typeof a).toBe('bigint');
  });
  it('throws on failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(getTokenAllowance({ owner: ADDR })).rejects.toThrow();
  });
});

describe('soroban – getUsdcAllowance', () => {
  beforeEach(() => setupSuccess(500n));
  it('delegates to getTokenAllowance', async () => {
    const a = await getUsdcAllowance({ owner: ADDR });
    expect(typeof a).toBe('bigint');
  });
});

describe('soroban – approveToken', () => {
  beforeEach(() => setupSuccess());
  it('builds an approve transaction', async () => {
    const tx = await approveToken({ from: ADDR, amount: 1000n });
    expect(tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    // getAccount succeeds, but simulateTransaction fails
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    await expect(approveToken({ from: ADDR, amount: 1000n })).rejects.toThrow();
  });
});

describe('soroban – appealDefault', () => {
  it('builds an appeal_default transaction', async () => {
    setupSuccess();
    const tx = await appealDefault(ADDR, 1n, 'evidence_hash_123');
    expect(tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    setupSuccess();
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    await expect(appealDefault(ADDR, 1n, 'hash')).rejects.toThrow('Simulation failed');
  });
});

describe('soroban – disputeInvoice', () => {
  beforeEach(() => setupSuccess());
  it('builds a dispute_invoice transaction', async () => {
    const tx = await disputeInvoice(ADDR, 1n, 'reason_hash');
    expect(tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(disputeInvoice(ADDR, 1n, 'hash')).rejects.toThrow('Simulation failed');
  });
});

describe('soroban – updateLPWhitelist', () => {
  it('throws unsupported error', async () => {
    await expect(updateLPWhitelist({ invoiceId: 1n, whitelist: [] })).rejects.toThrow(
      'not supported'
    );
  });
});

describe('soroban – claimDefault', () => {
  beforeEach(() => setupSuccess());
  it('builds a claim_default transaction', async () => {
    const tx = await claimDefault(ADDR, 1n);
    expect(tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(claimDefault(ADDR, 1n)).rejects.toThrow('Simulation failed');
  });
});

describe('soroban – updateInvoice', () => {
  beforeEach(() => setupSuccess());
  it('builds an update_invoice transaction', async () => {
    const r = await updateInvoice({
      freelancer: ADDR,
      invoiceId: 1n,
      amount: 200n,
      dueDate: 1893456000,
      discountRate: 300,
    });
    expect(r.tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(
      updateInvoice({
        freelancer: ADDR,
        invoiceId: 1n,
        amount: 200n,
        dueDate: 1893456000,
        discountRate: 300,
      })
    ).rejects.toThrow();
  });
});

describe('soroban – getReferralStats', () => {
  beforeEach(() => setupSuccess({ total_invoices: 5, total_volume: 1000n }));
  it('returns referral stats on success', async () => {
    const s = await getReferralStats('REF123');
    expect(s.total_invoices).toBe(5);
  });
  it('returns zero stats on failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    const s = await getReferralStats('NOPE');
    expect(s.total_invoices).toBe(0);
    expect(s.total_volume).toBe(0n);
  });
});

describe('soroban – submitInvoiceTransaction', () => {
  beforeEach(() => {
    setupSuccess(42n);
    (rpc.Api as any).GetTransactionStatus = { SUCCESS: 'SUCCESS' };
  });
  it('returns invoiceId and txHash on success', async () => {
    const r = await submitInvoiceTransaction({
      freelancer: ADDR,
      payer: ADDR,
      amount: 100n,
      dueDate: 1893456000,
      discountRate: 250,
      signTx: async () => 'signedXDR',
    });
    expect(r.txHash).toBe('h123');
    expect(typeof r.invoiceId).toBe('bigint');
  });
  it('throws on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'err' });
    await expect(
      submitInvoiceTransaction({
        freelancer: ADDR,
        payer: ADDR,
        amount: 100n,
        dueDate: 1893456000,
        discountRate: 250,
        signTx: async () => 'signedXDR',
      })
    ).rejects.toThrow('Simulation failed');
  });
  it('throws when send returns invalid response', async () => {
    mockServer.sendTransaction.mockResolvedValue({});
    await expect(
      submitInvoiceTransaction({
        freelancer: ADDR,
        payer: ADDR,
        amount: 100n,
        dueDate: 1893456000,
        discountRate: 250,
        signTx: async () => 'signedXDR',
      })
    ).rejects.toThrow('invalid response');
  });
  it('throws when send status is rejected', async () => {
    mockServer.sendTransaction.mockResolvedValue({ hash: 'h', status: 'ERROR' });
    await expect(
      submitInvoiceTransaction({
        freelancer: ADDR,
        payer: ADDR,
        amount: 100n,
        dueDate: 1893456000,
        discountRate: 250,
        signTx: async () => 'signedXDR',
      })
    ).rejects.toThrow('failed with status');
  });
  it('throws when poll returns non-success', async () => {
    mockServer.pollTransaction.mockResolvedValue({ status: 'FAILED' });
    await expect(
      submitInvoiceTransaction({
        freelancer: ADDR,
        payer: ADDR,
        amount: 100n,
        dueDate: 1893456000,
        discountRate: 250,
        signTx: async () => 'signedXDR',
      })
    ).rejects.toThrow('failed with status');
  });
  it('includes referral code when provided', async () => {
    const r = await submitInvoiceTransaction({
      freelancer: ADDR,
      payer: ADDR,
      amount: 100n,
      dueDate: 1893456000,
      discountRate: 250,
      signTx: async () => 'signedXDR',
      referralCode: 'REF',
    });
    expect(r.txHash).toBeDefined();
  });
});

describe('soroban – buildApproveTokenTransaction', () => {
  beforeEach(() => setupSuccess());
  it('builds an approve token tx', async () => {
    const tx = await buildApproveTokenTransaction({ owner: ADDR, amount: 1000n });
    expect(tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(buildApproveTokenTransaction({ owner: ADDR, amount: 1000n })).rejects.toThrow();
  });
});

describe('soroban – buildApproveUsdcTransaction', () => {
  beforeEach(() => setupSuccess());
  it('delegates to buildApproveTokenTransaction', async () => {
    const tx = await buildApproveUsdcTransaction({ owner: ADDR, amount: 1000n });
    expect(tx).toBeDefined();
  });
});

describe('soroban – submitSignedTransaction', () => {
  beforeEach(() => {
    setupSuccess();
    (rpc.Api as any).GetTransactionStatus = { SUCCESS: 'SUCCESS' };
  });
  it('returns txHash on success', async () => {
    const r = await submitSignedTransaction({ tx: mockTx, signTx: async () => 'signedXDR' });
    expect(r.txHash).toBe('h123');
  });
  it('throws on invalid send response', async () => {
    mockServer.sendTransaction.mockResolvedValue({});
    await expect(submitSignedTransaction({ tx: mockTx, signTx: async () => 'x' })).rejects.toThrow(
      'invalid'
    );
  });
  it('throws on rejected status', async () => {
    mockServer.sendTransaction.mockResolvedValue({ hash: 'h', status: 'ERROR' });
    await expect(submitSignedTransaction({ tx: mockTx, signTx: async () => 'x' })).rejects.toThrow(
      'failed with status'
    );
  });
  it('throws on poll failure', async () => {
    mockServer.pollTransaction.mockResolvedValue({ status: 'FAILED' });
    await expect(submitSignedTransaction({ tx: mockTx, signTx: async () => 'x' })).rejects.toThrow(
      'failed with status'
    );
  });
});

describe('soroban – convertInvoiceToken', () => {
  beforeEach(() => setupSuccess());
  it('builds a convert_invoice_token tx', async () => {
    const tx = await convertInvoiceToken(ADDR, 1n, USDC);
    expect(tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(convertInvoiceToken(ADDR, 1n, USDC)).rejects.toThrow();
  });
});

describe('soroban – getInsurancePoolInfo', () => {
  it('returns parsed info on success', async () => {
    setupSuccess({ balance: 1000n, enrolled_count: 5, premium_rate: 50 });
    const info = await getInsurancePoolInfo();
    expect(info.enrolled_count).toBe(5);
  });
  it('returns fallback on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    const info = await getInsurancePoolInfo();
    expect(info.enrolled_count).toBe(12);
  });
  it('returns fallback on exception', async () => {
    mockServer.simulateTransaction.mockRejectedValue(new Error('network'));
    const info = await getInsurancePoolInfo();
    expect(info.enrolled_count).toBe(12);
  });
});

describe('soroban – getLPInsuranceStatus', () => {
  beforeEach(() => setupSuccess(true));
  it('returns true when enrolled', async () => {
    (scValToNative as any).mockReturnValue(true);
    const s = await getLPInsuranceStatus(ADDR);
    expect(s).toBe(true);
  });
  it('returns false on failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    const s = await getLPInsuranceStatus(ADDR);
    expect(s).toBe(false);
  });
  it('returns false on exception', async () => {
    mockServer.simulateTransaction.mockRejectedValue(new Error('err'));
    const s = await getLPInsuranceStatus(ADDR);
    expect(s).toBe(false);
  });
});

describe('soroban – depositPremium', () => {
  beforeEach(() => setupSuccess());
  it('builds a deposit_premium tx', async () => {
    const tx = await depositPremium(ADDR, 1000n);
    expect(tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(depositPremium(ADDR, 1000n)).rejects.toThrow();
  });
});

describe('soroban – claimInsurance', () => {
  beforeEach(() => setupSuccess());
  it('builds a claim tx', async () => {
    const tx = await claimInsurance(ADDR, 1n);
    expect(tx).toBeDefined();
  });
  it('throws on simulation failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(claimInsurance(ADDR, 1n)).rejects.toThrow();
  });
});

describe('soroban – getReputation', () => {
  it('returns reputation on success', async () => {
    setupSuccess({ score: 90, invoices_submitted: 10, invoices_paid: 8, invoices_defaulted: 1 });
    const r = await getReputation(ADDR);
    expect(r).not.toBeNull();
    expect(r!.score).toBe(90);
  });
  it('returns null on failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    const r = await getReputation(ADDR);
    expect(r).toBeNull();
  });
  it('returns null on null retval', async () => {
    setupSuccess(null);
    (scValToNative as any).mockReturnValue(null);
    mockServer.simulateTransaction.mockResolvedValue({ result: { retval: null } });
    const r = await getReputation(ADDR);
    expect(r).toBeNull();
  });
  it('returns null on exception', async () => {
    mockServer.simulateTransaction.mockRejectedValue(new Error('err'));
    const r = await getReputation(ADDR);
    expect(r).toBeNull();
  });
});

describe('soroban – getReputationEvents', () => {
  it('returns events on success', async () => {
    setupSuccess([{ type: 'paid', timestamp: 1000, score: 80 }]);
    (scValToNative as any).mockReturnValue([{ type: 'paid', timestamp: 1000, score: 80 }]);
    const evts = await getReputationEvents(ADDR);
    expect(evts).toHaveLength(1);
    expect(evts[0].type).toBe('paid');
  });
  it('returns empty on failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    const evts = await getReputationEvents(ADDR);
    expect(evts).toEqual([]);
  });
  it('returns empty on non-array', async () => {
    setupSuccess('not-array');
    (scValToNative as any).mockReturnValue('not-array');
    const evts = await getReputationEvents(ADDR);
    expect(evts).toEqual([]);
  });
  it('filters events with invalid timestamps', async () => {
    setupSuccess([
      { type: 'paid', timestamp: 0 },
      { type: 'submitted', timestamp: 500 },
    ]);
    (scValToNative as any).mockReturnValue([
      { type: 'paid', timestamp: 0 },
      { type: 'submitted', timestamp: 500 },
    ]);
    const evts = await getReputationEvents(ADDR);
    expect(evts).toHaveLength(1);
  });
  it('returns empty on exception', async () => {
    mockServer.simulateTransaction.mockRejectedValue(new Error('err'));
    const evts = await getReputationEvents(ADDR);
    expect(evts).toEqual([]);
  });
});

describe('soroban – getPayerScoresBatch', () => {
  it('returns a map of scores', async () => {
    setupSuccess({ score: 85, settled_on_time: 10, defaults: 1 });
    const map = await getPayerScoresBatch([ADDR]);
    expect(map.get(ADDR)).toMatchObject({ score: 85 });
  });
  it('deduplicates addresses', async () => {
    setupSuccess({ score: 85, settled_on_time: 10, defaults: 1 });
    const map = await getPayerScoresBatch([ADDR, ADDR]);
    expect(map.size).toBe(1);
  });
});

describe('soroban – getTopPayers', () => {
  it('returns array of top payers on success', async () => {
    setupSuccess([
      { address: ADDR, score: 90, invoices_paid: 10, invoices_defaulted: 0, total_volume: 1000n },
    ]);
    (scValToNative as any).mockReturnValue([
      { address: ADDR, score: 90, invoices_paid: 10, invoices_defaulted: 0, total_volume: 1000n },
    ]);
    const payers = await getTopPayers(10);
    expect(payers).toHaveLength(1);
  });
  it('returns empty on failure', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    const payers = await getTopPayers();
    expect(payers).toEqual([]);
  });
  it('returns empty on non-array result', async () => {
    setupSuccess('not-array');
    (scValToNative as any).mockReturnValue('not-array');
    const payers = await getTopPayers();
    expect(payers).toEqual([]);
  });
  it('returns empty on exception', async () => {
    mockServer.simulateTransaction.mockRejectedValue(new Error('err'));
    const payers = await getTopPayers();
    expect(payers).toEqual([]);
  });
});

describe('soroban – getInvoiceCount additional', () => {
  it('throws when simulation fails after healthy check', async () => {
    setupSuccess();
    mockServer.getHealth.mockResolvedValue({ status: 'healthy' });
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    await expect(getInvoiceCount()).rejects.toThrow('Failed to get invoice count');
  });
});

describe('soroban – submitInvoicesBatch', () => {
  beforeEach(() => {
    setupSuccess(42n);
    (rpc.Api as any).GetTransactionStatus = { SUCCESS: 'SUCCESS' };
  });

  it('submits a single invoice batch successfully', async () => {
    const results = await submitInvoicesBatch(
      ADDR,
      [{ payer: ADDR, amount: '100', dueDate: '2026-01-01', discountRate: '5', tokenId: USDC }],
      async () => 'signedXDR'
    );
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].id).toBe('invoice-1');
  });

  it('handles individual invoice failure gracefully', async () => {
    // First call succeeds, second call fails simulation
    mockServer.simulateTransaction
      .mockResolvedValueOnce({ result: { retval: 42n } })
      .mockResolvedValueOnce({ error: 'fail' });
    (rpc.Api.isSimulationSuccess as any).mockReturnValueOnce(true).mockReturnValueOnce(false);

    const results = await submitInvoicesBatch(
      ADDR,
      [
        { payer: ADDR, amount: '100', dueDate: '2026-01-01', discountRate: '5', tokenId: USDC },
        { payer: ADDR, amount: '200', dueDate: '2026-02-01', discountRate: '3', tokenId: USDC },
      ],
      async () => 'signedXDR'
    );
    expect(results).toHaveLength(2);
    // At least one should have failed
    expect(results.some((r) => !r.success)).toBe(true);
  });

  it('returns empty results for empty invoice list', async () => {
    const results = await submitInvoicesBatch(ADDR, [], async () => 'signedXDR');
    expect(results).toEqual([]);
  });

  it('handles invalid invoice data', async () => {
    // parseAmountToUnits returns 0n for "0", which is falsy
    const { parseAmountToUnits } = await import('@/utils/invoiceSubmission');
    (parseAmountToUnits as any).mockReturnValueOnce(0n);

    const results = await submitInvoicesBatch(
      ADDR,
      [{ payer: ADDR, amount: '0', dueDate: '2026-01-01', discountRate: '5', tokenId: USDC }],
      async () => 'signedXDR'
    );
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
  });
});

describe('soroban – getWalletRoles extended', () => {
  it('identifies payer role', async () => {
    setupSuccess();
    const inv = {
      id: 1n,
      status: { Pending: null },
      freelancer: 'OTHER',
      payer: ADDR,
      amount: 100n,
      due_date: 1n,
      discount_rate: 100,
    };
    (scValToNative as any).mockReturnValueOnce(inv);
    (rpc.Api.isSimulationSuccess as any).mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockServer.simulateTransaction
      .mockResolvedValueOnce({ result: { retval: {} } })
      .mockResolvedValueOnce({ error: 'fail' });
    const roles = await getWalletRoles(ADDR);
    expect(roles).toContain('payer');
  });

  it('identifies lp role from funder field', async () => {
    setupSuccess();
    const inv = {
      id: 1n,
      status: { Funded: null },
      freelancer: 'OTHER',
      payer: 'OTHER2',
      funder: ADDR,
      amount: 100n,
      due_date: 1n,
      discount_rate: 100,
    };
    (scValToNative as any).mockReturnValueOnce(inv);
    (rpc.Api.isSimulationSuccess as any).mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockServer.simulateTransaction
      .mockResolvedValueOnce({ result: { retval: {} } })
      .mockResolvedValueOnce({ error: 'fail' });
    const roles = await getWalletRoles(ADDR);
    expect(roles).toContain('lp');
  });

  it('returns empty roles when no invoices match', async () => {
    setupSuccess();
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    mockServer.simulateTransaction.mockResolvedValue({ error: 'fail' });
    const roles = await getWalletRoles(ADDR);
    expect(roles).toEqual([]);
  });
});

describe('soroban – getInvoice parseStatus branches', () => {
  beforeEach(() => setupSuccess());

  it('parses string status directly', async () => {
    (scValToNative as any).mockReturnValue({
      id: 1n,
      freelancer: ADDR,
      payer: ADDR,
      amount: 100n,
      due_date: 1n,
      discount_rate: 100,
      status: 'Pending',
      funder: undefined,
      funded_at: undefined,
      token: USDC,
    });
    const inv = await getInvoice(1n);
    expect(inv.status).toBe('Pending');
  });
});

describe('soroban – submitInvoiceTransaction sim error without error field', () => {
  beforeEach(() => {
    setupSuccess(42n);
    (rpc.Api as any).GetTransactionStatus = { SUCCESS: 'SUCCESS' };
  });

  it('uses fallback message when simulated has no error field', async () => {
    (rpc.Api.isSimulationSuccess as any).mockReturnValue(false);
    // No 'error' field - should fall back to generic message
    mockServer.simulateTransaction.mockResolvedValue({ result: null });
    await expect(
      submitInvoiceTransaction({
        freelancer: ADDR,
        payer: ADDR,
        amount: 100n,
        dueDate: 1893456000,
        discountRate: 250,
        signTx: async () => 'signedXDR',
      })
    ).rejects.toThrow('Simulation failed');
  });
});

describe('soroban – getReferralStats exception path', () => {
  it('returns zero stats on exception', async () => {
    mockServer.simulateTransaction.mockRejectedValue(new Error('network error'));
    const s = await getReferralStats('CODE');
    expect(s.total_invoices).toBe(0);
    expect(s.total_volume).toBe(0n);
  });
});

describe('soroban – getPayerScore exception path', () => {
  it('returns null when simulateTransaction throws', async () => {
    const { getPayerScore } = await import('@/utils/soroban');
    mockServer.simulateTransaction.mockRejectedValue(new Error('network'));
    const score = await getPayerScore(ADDR);
    expect(score).toBeNull();
  });
});
