import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../app/api/notifications/[address]/route';
import { getNotifications } from '@/lib/notifications';

vi.mock('@/lib/notifications', () => ({
  getNotifications: vi.fn(),
}));

describe('/api/notifications/[address] API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns notifications for a valid wallet address', async () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'INVOICE_PAID',
        message: 'Invoice #101 has been paid',
        timestamp: '2026-07-25T12:00:00Z',
        read: false,
      },
    ];

    vi.mocked(getNotifications).mockResolvedValue(mockNotifications);

    const req = new NextRequest('http://localhost/api/notifications/GABC123');
    const response = await GET(req, { params: Promise.resolve({ address: 'GABC123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockNotifications);
    expect(getNotifications).toHaveBeenCalledWith('GABC123');
  });

  it('gracefully degrades to empty array when backing store throws error', async () => {
    vi.mocked(getNotifications).mockRejectedValue(new Error('Supabase store unavailable'));

    const req = new NextRequest('http://localhost/api/notifications/GABC123');
    const response = await GET(req, { params: Promise.resolve({ address: 'GABC123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});
