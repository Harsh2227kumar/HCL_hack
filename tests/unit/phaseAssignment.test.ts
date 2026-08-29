import { describe, it, expect } from 'vitest';
import { assignPhase, PhaseableResource } from '../../src/lib/core/phaseAssignment';

describe('assignPhase', () => {
  it('assigns Foundations when prerequisiteDepth === 0 and difficulty <= 2', () => {
    const res: PhaseableResource = {
      resourceId: 'res-1',
      type: 'course',
      difficulty: 2,
      prerequisiteDepth: 0,
    };
    expect(assignPhase(res)).toBe('Foundations');
  });

  it('assigns Core when prerequisiteDepth <= 2 and type !== "project"', () => {
    const res: PhaseableResource = {
      resourceId: 'res-2',
      type: 'course',
      difficulty: 3,
      prerequisiteDepth: 1,
    };
    expect(assignPhase(res)).toBe('Core');
  });

  it('assigns Applied Project when type === "project" and prerequisiteDepth < 4', () => {
    const res: PhaseableResource = {
      resourceId: 'res-3',
      type: 'project',
      difficulty: 3,
      prerequisiteDepth: 1,
    };
    expect(assignPhase(res)).toBe('Applied Project');
  });

  it('assigns Specialization when difficulty >= 4 and prerequisiteDepth >= 2', () => {
    const res: PhaseableResource = {
      resourceId: 'res-4',
      type: 'course',
      difficulty: 4,
      prerequisiteDepth: 2,
    };
    expect(assignPhase(res)).toBe('Specialization');
  });

  it('assigns Capstone when (type === "project" or "assessment") and prerequisiteDepth >= 4', () => {
    const resProject: PhaseableResource = {
      resourceId: 'res-5a',
      type: 'project',
      difficulty: 3,
      prerequisiteDepth: 4,
    };
    const resAssessment: PhaseableResource = {
      resourceId: 'res-5b',
      type: 'assessment',
      difficulty: 3,
      prerequisiteDepth: 5,
    };
    expect(assignPhase(resProject)).toBe('Capstone');
    expect(assignPhase(resAssessment)).toBe('Capstone');
  });

  it('falls back to Core when no specific rule matches', () => {
    const res: PhaseableResource = {
      resourceId: 'res-fallback',
      type: 'course',
      difficulty: 3,
      prerequisiteDepth: 5,
    };
    expect(assignPhase(res)).toBe('Core');
  });
});
