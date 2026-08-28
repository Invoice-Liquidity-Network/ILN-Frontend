export interface LeaderboardResult<T = unknown[]> {
  data: T;
  /** True when the indexer was unreachable (distinct from "no rows"). */
  unavailable: boolean;
}

/**
 * Fetch the leaderboard from the indexer service. Returns a discriminated result
 * so callers can distinguish "indexer temporarily unavailable" from "no rows" —
 * the former should surface an honest unavailable state rather than empty data.
 */
export async function getLeaderboard<T = unknown[]>(
  type: string,
  period: string
): Promise<LeaderboardResult<T>> {
  const indexerUrl = process.env.INDEXER_URL;
  if (!indexerUrl) {
    return { data: [] as unknown as T, unavailable: false };
  }

  try {
    const res = await fetch(`${indexerUrl}/leaderboard?type=${type}&period=${period}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    return { data: (await res.json()) as T, unavailable: false };
  } catch (error) {
    console.error(error);
    return { data: [] as unknown as T, unavailable: true };
  }
}
