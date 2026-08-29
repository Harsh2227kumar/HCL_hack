/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { POST } from '../../src/app/api/progress/route';
import { bktUpdate } from '../../src/lib/core/reconciliation';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    progressEvent: {
      create: vi.fn(),
    },
    learnerProfile: {
      findUnique: vi.fn(),
    },
    learningResource: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    skillEvidence: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    learnerSkill: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn().mockImplementation(async (args: any) => ({
        id: 'sk-created',
        ...args.data,
      })),
    },
    learningPath: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    learningPathItem: {
      updateMany: vi.fn(),
    },
  },
}));

describe('Assessment BKT & Evidence Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates SkillEvidence with source assessment and updates LearnerSkill for high assessment score', async () => {
    const userId = 'user-ass-1';
    const resourceId = 'assessment-res-1';

    vi.mocked(prisma.progressEvent.create).mockResolvedValue({
      id: 'event-1',
      userId,
      resourceId,
      eventType: 'completed',
      score: 4.5,
      createdAt: new Date(),
    } as any);

    vi.mocked(prisma.learnerProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      userId,
      weeklyHours: 10,
      learningStyle: 'visual',
      experienceLevel: 'Intermediate',
    } as any);

    vi.mocked(prisma.learningResource.findUnique).mockResolvedValue({
      id: resourceId,
      title: 'Python Skills Assessment',
      type: 'assessment',
      difficulty: 3,
      skillsTaught: ['Python'],
      prerequisiteSkills: [],
      durationHours: 1,
      format: 'interactive',
    } as any);

    vi.mocked(prisma.skillEvidence.findFirst).mockResolvedValue(null);

    const initialEstimate = 2.0;
    vi.mocked(prisma.learnerSkill.findMany).mockResolvedValue([
      {
        id: 'sk-py',
        userId,
        skillName: 'Python',
        finalEstimate: initialEstimate,
        targetLevel: 5,
        confidenceScore: 0.5,
      },
    ] as any);

    vi.mocked(prisma.skillEvidence.create).mockResolvedValue({
      id: 'ev-1',
      userId,
      skillName: 'Python',
      source: 'assessment',
      score: 4.5,
      reliability: 0.6,
      recencyWeight: 1.0,
      timestamp: new Date(),
    } as any);

    vi.mocked(prisma.learnerSkill.update).mockResolvedValue({} as any);

    // Mock non-replan path update
    vi.mocked(prisma.learningPath.findFirst).mockResolvedValue({
      id: 'path-1',
      userId,
      version: 1,
    } as any);

    const request = new Request('http://localhost/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        resourceId,
        eventType: 'completed',
        score: 4.5,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    // Verify SkillEvidence was created with source: 'assessment'
    expect(prisma.skillEvidence.create).toHaveBeenCalledWith({
      data: {
        userId,
        skillName: 'Python',
        source: 'assessment',
        score: 4.5,
        reliability: 0.6,
        recencyWeight: 1.0,
      },
    });

    // Verify LearnerSkill update
    const expectedPKnown = bktUpdate(initialEstimate / 5, true);
    const expectedFinalEstimate = expectedPKnown * 5;

    expect(prisma.learnerSkill.update).toHaveBeenCalledWith({
      where: { id: 'sk-py' },
      data: {
        finalEstimate: expectedFinalEstimate,
        lastAssessed: expect.any(Date),
      },
    });
  });

  it('updates LearnerSkill with lower estimate for low assessment score', async () => {
    const userId = 'user-ass-2';
    const resourceId = 'assessment-res-2';

    vi.mocked(prisma.progressEvent.create).mockResolvedValue({
      id: 'event-2',
      userId,
      resourceId,
      eventType: 'completed',
      score: 1.0, // Low score < 2.5
      createdAt: new Date(),
    } as any);

    vi.mocked(prisma.learnerProfile.findUnique).mockResolvedValue({
      id: 'profile-2',
      userId,
      weeklyHours: 10,
      learningStyle: 'visual',
      experienceLevel: 'Intermediate',
    } as any);

    vi.mocked(prisma.learningResource.findUnique).mockResolvedValue({
      id: resourceId,
      title: 'SQL Assessment',
      type: 'assessment',
      difficulty: 3,
      skillsTaught: ['SQL'],
      prerequisiteSkills: [],
      durationHours: 1,
      format: 'interactive',
    } as any);

    vi.mocked(prisma.skillEvidence.findFirst).mockResolvedValue(null);

    const initialEstimate = 4.0;
    vi.mocked(prisma.learnerSkill.findMany).mockResolvedValue([
      {
        id: 'sk-sql',
        userId,
        skillName: 'SQL',
        finalEstimate: initialEstimate,
        targetLevel: 5,
        confidenceScore: 0.8,
      },
    ] as any);

    vi.mocked(prisma.skillEvidence.create).mockResolvedValue({} as any);
    vi.mocked(prisma.learnerSkill.update).mockResolvedValue({} as any);

    vi.mocked(prisma.learningPath.findFirst).mockResolvedValue({
      id: 'path-1',
      userId,
      version: 1,
    } as any);

    const request = new Request('http://localhost/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        resourceId,
        eventType: 'completed',
        score: 1.0,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    // Verify SkillEvidence created
    expect(prisma.skillEvidence.create).toHaveBeenCalledWith({
      data: {
        userId,
        skillName: 'SQL',
        source: 'assessment',
        score: 1.0,
        reliability: 0.6,
        recencyWeight: 1.0,
      },
    });

    // Verify LearnerSkill updated with incorrect bktUpdate (false)
    const expectedPKnown = bktUpdate(initialEstimate / 5, false);
    const expectedFinalEstimate = expectedPKnown * 5;

    expect(prisma.learnerSkill.update).toHaveBeenCalledWith({
      where: { id: 'sk-sql' },
      data: {
        finalEstimate: expectedFinalEstimate,
        lastAssessed: expect.any(Date),
      },
    });
  });
});
