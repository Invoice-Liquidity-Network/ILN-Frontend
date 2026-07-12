import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../app/api/reminders/route';
import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import * as soroban from '@/utils/soroban';

// Mock Resend
vi.mock('resend', () => {
  const send = vi.fn().mockResolvedValue({ data: { id: 'test-email-id' }, error: null });
  return {
    Resend: vi.fn().mockImplementation(function () {
      return {
        emails: { send },
      };
    }),
  };
});

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  const mock = {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  };
  return {
    getSupabaseAdmin: vi.fn(() => mock),
    supabase: mock,
  };
});

// Mock Soroban utils
vi.mock('@/utils/soroban', () => ({
  getAllInvoices: vi.fn(),
  getTokenMetadata: vi.fn(),
}));

describe('/api/reminders API route', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    process.env.RESEND_API_KEY = 're_test_123';

    mockSupabase = getSupabaseAdmin();
    // Default mocks for chaining
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.upsert.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.insert.mockReturnValue(mockSupabase);
  });

  describe('POST handler', () => {
    it('should successfully save reminder preferences', async () => {
      mockSupabase.upsert.mockResolvedValue({ error: null });

      const payload = {
        address: 'GABC123',
        email: 'test@example.com',
        enabled: true,
      };

      const req = new NextRequest('http://localhost/api/reminders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await POST(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      expect(mockSupabase.from).toHaveBeenCalledWith('reminder_preferences');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          address: payload.address,
          email: payload.email,
        }),
        { onConflict: 'address' }
      );
    });
  });

  describe('GET handler (Cron Trigger)', () => {
    it('should send a reminder email for an invoice due in 72 hours', async () => {
      const now = Math.floor(Date.now() / 1000);
      const dueIn71Hours = now + 71 * 3600;
      const payerAddress = 'GPA123';

      // 1. Mock preferences
      mockSupabase.eq.mockResolvedValueOnce({
        data: [{ address: payerAddress, email: 'payer@example.com', enabled: true }],
        error: null,
      });

      // 2. Mock invoices
      vi.mocked(soroban.getAllInvoices).mockResolvedValue([
        {
          id: 101n,
          payer: payerAddress,
          status: 'Funded',
          due_date: BigInt(dueIn71Hours),
          token: 'USDC_CONTRACT',
          amount: 500000000n,
          freelancer: 'GFL123',
          discount_rate: 0,
        },
      ]);

      vi.mocked(soroban.getTokenMetadata).mockResolvedValue({
        contractId: 'USDC_CONTRACT',
        symbol: 'USDC',
        decimals: 7,
        name: 'USD Coin',
      });

      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockSupabase.insert.mockResolvedValue({ error: null });

      const req = new NextRequest('http://localhost/api/reminders', {
        headers: { authorization: 'Bearer test-secret' },
      });

      const response = await GET(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.sentCount).toBe(1);

      const resendInstance = new Resend();
      expect(resendInstance.emails.send).toHaveBeenCalled();
    });

    it('should not send duplicate emails for the same milestone', async () => {
      const now = Math.floor(Date.now() / 1000);
      const dueIn23Hours = now + 23 * 3600;
      const payerAddress = 'GPA123';

      mockSupabase.eq.mockResolvedValueOnce({
        data: [{ address: payerAddress, email: 'payer@example.com', enabled: true }],
        error: null,
      });

      vi.mocked(soroban.getAllInvoices).mockResolvedValue([
        {
          id: 102n,
          payer: payerAddress,
          status: 'Funded',
          due_date: BigInt(dueIn23Hours),
          token: 'USDC_CONTRACT',
          amount: 500000000n,
          freelancer: 'GFL123',
          discount_rate: 0,
        },
      ]);

      mockSupabase.maybeSingle.mockResolvedValue({
        data: { id: 'existing-log-id' },
        error: null,
      });

      const req = new NextRequest('http://localhost/api/reminders', {
        headers: { authorization: 'Bearer test-secret' },
      });

      const response = await GET(req);
      const body = await response.json();

      expect(body.sentCount).toBe(0);
    });
  });
});
