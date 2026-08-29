import { describe, it, expect } from 'vitest';
import { reciprocalRankFusion, RankedItem } from '../../src/lib/core/rrf';

describe('reciprocalRankFusion (RRF)', () => {
  it('an item ranked #1 in two lists scores higher than an item ranked #1 in only one list', () => {
    const list1: RankedItem[] = [
      { id: 'res-A', rank: 1 },
      { id: 'res-B', rank: 2 },
    ];
    const list2: RankedItem[] = [
      { id: 'res-A', rank: 1 },
      { id: 'res-C', rank: 2 },
    ];

    const results = reciprocalRankFusion([list1, list2], 60);

    expect(results.length).toBe(3);
    // res-A appears in both lists at rank 1: 1/(60+1) + 1/(60+1) = 2/61 ~ 0.032787
    // res-B appears in list1 at rank 2: 1/(60+2) = 1/62 ~ 0.016129
    // res-C appears in list2 at rank 2: 1/(60+2) = 1/62 ~ 0.016129
    expect(results[0].id).toBe('res-A');
    expect(results[0].rrfScore).toBeGreaterThan(results[1].rrfScore);
  });

  it('an item absent from a ranking list does not error and receives no score from that list', () => {
    const list1: RankedItem[] = [{ id: 'res-A', rank: 1 }];
    const list2: RankedItem[] = [{ id: 'res-B', rank: 1 }];

    const results = reciprocalRankFusion([list1, list2], 60);

    expect(results.length).toBe(2);
    // Both score 1/61
    expect(results[0].rrfScore).toEqual(results[1].rrfScore);
    expect(results.map((r) => r.id)).toEqual(expect.arrayContaining(['res-A', 'res-B']));
  });

  it('empty rankings array returns empty result', () => {
    expect(reciprocalRankFusion([])).toEqual([]);
    expect(reciprocalRankFusion([[]])).toEqual([]);
  });
});
