/**
 * Reciprocal Rank Fusion (RRF) Module
 *
 * Note: RRF is implemented as an isolated, unit-tested module and is not yet
 * wired into recommend/route.ts. The recommendation pipeline currently uses
 * dense (pgvector) retrieval; RRF integration will be enabled when sparse/keyword
 * retrieval is introduced.
 */

export interface RankedItem {
  id: string;
  rank: number; // 1-indexed position in its source ranking
}

/**
 * Computes Reciprocal Rank Fusion scores across multiple ranked lists.
 * RRF Score for item d = sum_m 1 / (k + r_m(d))
 *
 * @param rankings Array of ranked lists
 * @param k Smoothing constant (default = 60)
 * @returns Sorted array of objects { id, rrfScore } descending by score
 */
export function reciprocalRankFusion(
  rankings: RankedItem[][],
  k: number = 60
): { id: string; rrfScore: number }[] {
  if (!rankings || rankings.length === 0) {
    return [];
  }

  const scoreMap = new Map<string, number>();

  for (const list of rankings) {
    if (!list) continue;
    for (const item of list) {
      if (!item || !item.id || typeof item.rank !== 'number') continue;
      const currentScore = scoreMap.get(item.id) ?? 0;
      scoreMap.set(item.id, currentScore + 1 / (k + item.rank));
    }
  }

  const result: { id: string; rrfScore: number }[] = [];
  for (const [id, score] of scoreMap.entries()) {
    result.push({
      id,
      rrfScore: Number(score.toFixed(6)),
    });
  }

  result.sort((a, b) => b.rrfScore - a.rrfScore);

  return result;
}
