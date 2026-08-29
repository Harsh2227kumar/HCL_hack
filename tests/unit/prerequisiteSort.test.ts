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

  test('selects only the single best provider when multiple resources teach a prerequisite skill', () => {
    const candidates: RankedResource[] = [
      {
        resourceId: 'res-A', // Best provider for Skill-X (score 0.9)
        score: 0.9,
        skillsTaught: ['Skill-X'],
        prerequisiteSkills: [],
        durationHours: 5,
        difficulty: 2,
      },
      {
        resourceId: 'res-B', // Lower score provider for Skill-X (score 0.6)
        score: 0.6,
        skillsTaught: ['Skill-X'],
        prerequisiteSkills: [],
        durationHours: 5,
        difficulty: 2,
      },
      {
        resourceId: 'res-C', // Lowest score provider for Skill-X (score 0.4)
        score: 0.4,
        skillsTaught: ['Skill-X'],
        prerequisiteSkills: [],
        durationHours: 5,
        difficulty: 2,
      },
      {
        resourceId: 'res-D', // Requires Skill-X
        score: 0.95,
        skillsTaught: ['Advanced Topic'],
        prerequisiteSkills: ['Skill-X'],
        durationHours: 10,
        difficulty: 3,
      },
    ];

    const result = prerequisiteSort(candidates, 10);
    expect(result.items.length).toBe(4);

    const posA = result.items.find((item) => item.resourceId === 'res-A')!.position;
    const posD = result.items.find((item) => item.resourceId === 'res-D')!.position;

    // Res-A must come before Res-D because Res-A was chosen as the provider
    expect(posA).toBeLessThan(posD);
  });

  test('assigns semantic phases based on depth and resource metadata', () => {
    const candidates: RankedResource[] = [
      {
        resourceId: 'res-foundations',
        score: 0.9,
        skillsTaught: ['Foundational Skill'],
        prerequisiteSkills: [],
        durationHours: 5,
        difficulty: 1,
        type: 'course',
      },
      {
        resourceId: 'res-project',
        score: 0.85,
        skillsTaught: ['Applied Skill'],
        prerequisiteSkills: ['Foundational Skill'],
        durationHours: 10,
        difficulty: 3,
        type: 'project',
      },
    ];

    const result = prerequisiteSort(candidates, 10);
    const itemFoundations = result.items.find((i) => i.resourceId === 'res-foundations');
    const itemProject = result.items.find((i) => i.resourceId === 'res-project');

    expect(itemFoundations?.phase).toBe('Foundations');
    expect(itemProject?.phase).toBe('Applied Project');
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
