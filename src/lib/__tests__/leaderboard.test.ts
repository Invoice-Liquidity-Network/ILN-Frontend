import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLeaderboard } from '../leaderboard';

const fetchMock = vi.fn();

describe('getLeaderboard', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('fetches and returns the leaderboard JSON', async () => {
    const rows = [{ address: 'GADDR', amountFunded: 100 }];
    fetchMock.mockResolvedValue({ ok: true, json: async () => rows });

    const result = await getLeaderboard('lp', '30d');
    expect(result).toEqual(rows);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/leaderboard?type=lp&period=30d'),
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('returns an empty array when the response is not ok', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const result = await getLeaderboard('lp', '30d');
    expect(result).toEqual([]);
  });

  it('returns an empty array when the fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const result = await getLeaderboard('lp', '30d');
    expect(result).toEqual([]);
  });
});
