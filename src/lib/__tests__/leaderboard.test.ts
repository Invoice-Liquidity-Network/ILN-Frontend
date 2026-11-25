import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyLeaderboardReorg,
  createLeaderboardReorgState,
  getLeaderboard,
  reconcileLeaderboardSnapshot,
} from '../leaderboard';

const fetchMock = vi.fn();
const originalFetch = global.fetch;
const VERSION = { 'X-Indexer-Api-Version': '1.0.0' };

describe('getLeaderboard', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('INDEXER_URL', 'https://indexer.iln.example.com');
    vi.stubEnv('INDEXER_API_KEY', 'sk_leaderboard_test');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reads through the server-only indexer client and returns validated rows', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ address: 'GADDR', amountFunded: 100 }, { amountFunded: 1 }]), {
        headers: VERSION,
      })
    );

    const result = await getLeaderboard('payer', '90d', 5);

    expect(result).toMatchObject({
      data: [{ address: 'GADDR', amountFunded: 100 }],
      unavailable: false,
      meta: { droppedRecords: 1, apiVersion: '1.0.0' },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://indexer.iln.example.com/leaderboard?type=payer&period=90d&limit=5');
    expect(init.headers.Authorization).toBe('Bearer sk_leaderboard_test');
    expect(init.cache).toBe('no-store');
  });

  it('marks an empty leaderboard as empty, not unavailable', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { headers: VERSION }));
    await expect(getLeaderboard('lp', '30d')).resolves.toMatchObject({
      data: [],
      unavailable: false,
      status: 'empty',
    });
  });

  it.each([
    [401, 'unauthorized', 'unauthorized'],
    [429, 'rate_limited', 'rate-limited'],
    [500, 'upstream', 'unavailable'],
  ])('reports HTTP %i as unavailable with code %s', async (status, code, boundary) => {
    fetchMock.mockResolvedValue(new Response('{}', { status }));
    await expect(getLeaderboard('lp', '30d')).resolves.toEqual({
      data: [],
      unavailable: true,
      status: boundary,
      code,
      error: expect.any(String),
    });
  });

  it('reports unavailable when the fetch throws (indexer down)', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    await expect(getLeaderboard('lp', '30d')).resolves.toMatchObject({
      data: [],
      unavailable: true,
      code: 'network',
    });
  });

  it('reports malformed payloads and version drift as malformed', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"rows":[]}', { headers: VERSION }));
    await expect(getLeaderboard('lp', '30d')).resolves.toMatchObject({
      unavailable: true,
      status: 'malformed',
      code: 'schema',
    });

    fetchMock.mockResolvedValueOnce(
      new Response('[]', { headers: { 'X-Indexer-Api-Version': '2.0.0' } })
    );
    await expect(getLeaderboard('lp', '30d')).resolves.toMatchObject({
      unavailable: true,
      status: 'malformed',
      code: 'version_mismatch',
    });
  });

  it('reports a missing INDEXER_URL as not_configured instead of an empty leaderboard', async () => {
    vi.stubEnv('INDEXER_URL', '');
    const result = await getLeaderboard('lp', '30d');
    expect(result).toMatchObject({ data: [], unavailable: true, code: 'not_configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('leaderboard reorg correction handling', () => {
  it('replaces rolled-back events and recomputes ranks and volume totals without stale state', () => {
    const initial = createLeaderboardReorgState([
      { id: 'ev-1', ledger: 100, address: 'GALPHA', volume: 500 },
      { id: 'ev-2', ledger: 101, address: 'GBETA', volume: 1200 },
      { id: 'ev-3', ledger: 102, address: 'GGAMMA', volume: 900 },
    ]);

    expect(initial.rows.map((r) => [r.rank, r.address, r.totalVolume])).toEqual([
      [1, 'GBETA', 1200],
      [2, 'GGAMMA', 900],
      [3, 'GALPHA', 500],
    ]);

    // Reorg at ledger 101: ev-2 and ev-3 are rolled back; canonical branch has ev-2b for GALPHA.
    const corrected = applyLeaderboardReorg(initial, {
      rollbackToLedger: 101,
      replacementEvents: [
        { id: 'ev-2b', ledger: 101, address: 'GALPHA', volume: 300 },
      ],
    });

    expect(corrected.rolledBackCount).toBe(2);
    expect(corrected.lastIndexedLedger).toBe(101);
    expect(corrected.rows).toEqual([
      {
        rank: 1,
        address: 'GALPHA',
        totalVolume: 800,
        eventCount: 2,
        yieldEarned: 0,
        lastLedger: 101,
      },
    ]);
  });

  it('prevents duplicate event replay across pre-reorg and replacement events', () => {
    const initial = createLeaderboardReorgState([
      { id: 'ev-1', ledger: 100, address: 'GALPHA', volume: 500 },
      { id: 'ev-2', ledger: 102, address: 'GBETA', volume: 400 },
    ]);

    const corrected = applyLeaderboardReorg(initial, {
      rollbackToLedger: 102,
      replacementEvents: [
        // Duplicate of retained pre-reorg event (and below rollbackToLedger) must be ignored
        { id: 'ev-1', ledger: 100, address: 'GALPHA', volume: 500 },
        // Duplicate replacement event id must only be counted once
        { id: 'ev-3', ledger: 102, address: 'GBETA', volume: 250 },
        { id: 'ev-3', ledger: 102, address: 'GBETA', volume: 250 },
      ],
    });

    expect(corrected.rows.map((r) => [r.rank, r.address, r.totalVolume])).toEqual([
      [1, 'GALPHA', 500],
      [2, 'GBETA', 250],
    ]);
  });

  it('rejects negative or non-integer rollbackToLedger', () => {
    const initial = createLeaderboardReorgState([]);
    expect(() => applyLeaderboardReorg(initial, { rollbackToLedger: -1 })).toThrow(RangeError);
    expect(() => applyLeaderboardReorg(initial, { rollbackToLedger: 1.5 })).toThrow(RangeError);
  });

  it('replaces snapshot on explicit reorg signal even if ledger decreased, and rejects stale non-reorg snapshots', () => {
    const current = {
      rows: [{ address: 'GSTALE', totalVolume: 999 }],
      lastIndexedLedger: 150,
    };

    const stale = reconcileLeaderboardSnapshot(current, {
      rows: [{ address: 'GOLDER', totalVolume: 100 }],
      lastIndexedLedger: 140,
    });
    expect(stale.replaced).toBe(false);
    expect(stale.rows).toEqual(current.rows);

    const reorged = reconcileLeaderboardSnapshot(current, {
      rows: [
        { address: 'GCANON', totalVolume: 700 },
        { address: 'GCANON', totalVolume: 700 },
      ],
      lastIndexedLedger: 148,
      reorgFromLedger: 145,
    });
    expect(reorged.replaced).toBe(true);
    expect(reorged.lastIndexedLedger).toBe(148);
    expect(reorged.rows).toEqual([{ address: 'GCANON', totalVolume: 700 }]);
  });
});
