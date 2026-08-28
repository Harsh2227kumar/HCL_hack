import { describe, test, expect } from 'vitest';
import { prerequisiteSort, RankedResource } from '../../src/lib/core/prerequisiteSort';

describe('prerequisiteSort', () => {
  test('sorts simple valid chain (A teaches X, B requires X) so A comes before B', () => {
    const candidates: RankedResource[] = [
      {
        resourceId: 'res-B',
        score: 0.9,
        skillsTaught: ['Node.js API Development'],
        prerequisiteSkills: ['JavaScript Fundamentals'],
        durationHours: 10,
        difficulty: 3,
      },
      {
        resourceId: 'res-A',
        score: 0.8,
        skillsTaught: ['JavaScript Fundamentals'],
        prerequisiteSkills: [],
        durationHours: 5,
        difficulty: 1,
      },
    ];

    const result = prerequisiteSort(candidates, 10);
    expect(result.items.length).toBe(2);

    const posA = result.items.find((item) => item.resourceId === 'res-A')?.position;
    const posB = result.items.find((item) => item.resourceId === 'res-B')?.position;

    expect(posA).toBeDefined();
    expect(posB).toBeDefined();
    expect(posA!).toBeLessThan(posB!);
  });

  test('handles cyclic input graph (A -> B -> C -> A) without throwing and returns valid order', () => {
    const cyclicCandidates: RankedResource[] = [
      {
        resourceId: 'res-A',
        score: 0.7,
        skillsTaught: ['Skill-A'],
        prerequisiteSkills: ['Skill-C'],
        durationHours: 5,
        difficulty: 2,
      },
      {
        resourceId: 'res-B',
        score: 0.8,
        skillsTaught: ['Skill-B'],
        prerequisiteSkills: ['Skill-A'],
        durationHours: 5,
        difficulty: 3,
      },
      {
        resourceId: 'res-C',
        score: 0.6,
        skillsTaught: ['Skill-C'],
        prerequisiteSkills: ['Skill-B'],
        durationHours: 5,
        difficulty: 4,
      },
    ];

    expect(() => {
      const result = prerequisiteSort(cyclicCandidates, 10);
      expect(result.items.length).toBe(3);
      const ids = result.items.map((i) => i.resourceId);
      expect(ids).toContain('res-A');
      expect(ids).toContain('res-B');
      expect(ids).toContain('res-C');
    }).not.toThrow();
  });

  test('buckets 10 items correctly into 5 phases', () => {
    const tenCandidates: RankedResource[] = Array.from({ length: 10 }, (_, i) => ({
      resourceId: `res-${i + 1}`,
      score: 1 - i * 0.05,
      skillsTaught: [`Skill-${i + 1}`],
      prerequisiteSkills: i > 0 ? [`Skill-${i}`] : [],
      durationHours: 4,
      difficulty: Math.min(5, Math.floor(i / 2) + 1),
    }));

    const result = prerequisiteSort(tenCandidates, 10);
    expect(result.items.length).toBe(10);

    const phases = result.items.map((item) => item.phase);
    expect(phases[0]).toBe('Foundations');
    expect(phases[1]).toBe('Foundations');
    expect(phases[2]).toBe('Core');
    expect(phases[3]).toBe('Core');
    expect(phases[4]).toBe('Applied Project');
    expect(phases[5]).toBe('Applied Project');
    expect(phases[6]).toBe('Specialization');
    expect(phases[7]).toBe('Specialization');
    expect(phases[8]).toBe('Capstone');
    expect(phases[9]).toBe('Capstone');
  });

  test('computes estimatedWeeksToGoal correctly for known duration/hours input', () => {
    const candidates: RankedResource[] = [
      {
        resourceId: 'res-1',
        score: 0.9,
        skillsTaught: ['SQL'],
        prerequisiteSkills: [],
        durationHours: 15,
        difficulty: 2,
      },
      {
        resourceId: 'res-2',
        score: 0.85,
        skillsTaught: ['PostgreSQL'],
        prerequisiteSkills: ['SQL'],
        durationHours: 25,
        difficulty: 3,
      },
    ];

    // Total hours = 40. Weekly hours = 10. Expected weeks = ceil(40/10) = 4 weeks.
    const result = prerequisiteSort(candidates, 10);
    expect(result.estimatedWeeksToGoal).toBe(4);

    // Total hours = 40. Weekly hours = 15. Expected weeks = ceil(40/15) = 3 weeks.
    const result2 = prerequisiteSort(candidates, 15);
    expect(result2.estimatedWeeksToGoal).toBe(3);
  });

  test('returns empty items and 0 estimatedWeeksToGoal for empty candidates array', () => {
    const result = prerequisiteSort([], 10);
    expect(result.items).toEqual([]);
    expect(result.estimatedWeeksToGoal).toBe(0);
  });
});
