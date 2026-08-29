import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import {
  findHarderAlternative,
  findRemedialPrerequisiteResource,
} from '../../src/lib/core/resourceReplacement';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    learningResource: {
      findMany: vi.fn(),
    },
  },
}));

describe('resourceReplacement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findHarderAlternative returns null when no candidate resources match', async () => {
    const currentResource = {
      id: 'res-1',
      title: 'Intro to Python',
      skillsTaught: ['Python'],
      prerequisiteSkills: [],
      difficulty: 1,
    };

    vi.mocked(prisma.learningResource.findMany).mockResolvedValue([]);

    const result = await findHarderAlternative(
      currentResource,
      [{ skillName: 'Python', finalEstimate: 4.5, targetLevel: 5, confidenceScore: 0.8 }],
      new Set(['res-1']),
      {
        skillEstimates: [{ skill_name: 'Python', final_estimate: 4.5 }],
        weeklyHours: 10,
        learningStyle: 'visual',
        pastFeedback: [],
      }
    );

    expect(result.targetSkill).toBe('Python');
    expect(result.replacementResource).toBeNull();
    expect(prisma.learningResource.findMany).toHaveBeenCalledTimes(1);
  });

  it('findHarderAlternative returns higher difficulty replacement resource when candidate matches', async () => {
    const currentResource = {
      id: 'res-1',
      title: 'Intro to Python',
      skillsTaught: ['Python'],
      prerequisiteSkills: [],
      difficulty: 1,
    };

    const harderResource = {
      id: 'res-harder',
      title: 'Advanced Python Mastery',
      skillsTaught: ['Python'],
      prerequisiteSkills: ['Python'],
      difficulty: 3,
      durationHours: 10,
      format: 'video',
    };

    vi.mocked(prisma.learningResource.findMany).mockResolvedValue([harderResource as any]);

    const result = await findHarderAlternative(
      currentResource,
      [{ skillName: 'Python', finalEstimate: 4.5, targetLevel: 5, confidenceScore: 0.8 }],
      new Set(['res-1']),
      {
        skillEstimates: [{ skill_name: 'Python', final_estimate: 4.5 }],
        weeklyHours: 10,
        learningStyle: 'visual',
        pastFeedback: [],
      }
    );

    expect(result.targetSkill).toBe('Python');
    expect(result.replacementResource).toEqual(harderResource);
  });

  it('findRemedialPrerequisiteResource returns easier remedial resource', async () => {
    const currentResource = {
      id: 'res-2',
      title: 'Advanced Machine Learning',
      skillsTaught: ['Machine Learning'],
      prerequisiteSkills: ['Linear Algebra'],
      difficulty: 4,
    };

    const remedialResource = {
      id: 'res-remedial',
      title: 'Linear Algebra Foundations',
      skillsTaught: ['Linear Algebra'],
      prerequisiteSkills: [],
      difficulty: 1,
      durationHours: 5,
      format: 'text',
    };

    vi.mocked(prisma.learningResource.findMany).mockResolvedValue([remedialResource as any]);

    const result = await findRemedialPrerequisiteResource(
      currentResource,
      [{ skillName: 'Linear Algebra', finalEstimate: 1.0, targetLevel: 5, confidenceScore: 0.5 }],
      new Set(['res-2']),
      {
        skillEstimates: [{ skill_name: 'Linear Algebra', final_estimate: 1.0 }],
        weeklyHours: 10,
        learningStyle: 'visual',
        pastFeedback: [],
      }
    );

    expect(result.weakestSkill).toBe('Linear Algebra');
    expect(result.insertedResource).toEqual(remedialResource);
  });
});
