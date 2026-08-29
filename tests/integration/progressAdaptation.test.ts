import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { POST } from '../../src/app/api/progress/route';

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

describe('Progress Adaptation Preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves completed status for non-target items when replanning after a too_hard event', async () => {
    const userId = 'user-123';
    const hardResourceId = 'res-2';

    // Mock progressEvent.create
    vi.mocked(prisma.progressEvent.create).mockResolvedValue({
      id: 'event-1',
      userId,
      resourceId: hardResourceId,
      eventType: 'too_hard',
      score: null,
      createdAt: new Date(),
    } as any);

    // Mock learnerProfile
    vi.mocked(prisma.learnerProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      userId,
      weeklyHours: 10,
      learningStyle: 'visual',
      experienceLevel: 'Intermediate',
    } as any);

    // Mock learningResource.findUnique for the target resource
    vi.mocked(prisma.learningResource.findUnique).mockResolvedValue({
      id: hardResourceId,
      title: 'Advanced ML',
      difficulty: 4,
      skillsTaught: ['Machine Learning'],
      prerequisiteSkills: ['Linear Algebra'],
      durationHours: 10,
      format: 'video',
    } as any);

    // Mock skillEvidence
    vi.mocked(prisma.skillEvidence.findFirst).mockResolvedValue(null);

    // Mock learnerSkill.findMany
    vi.mocked(prisma.learnerSkill.findMany).mockResolvedValue([
      {
        id: 'sk-1',
        userId,
        skillName: 'Linear Algebra',
        finalEstimate: 1.0, // Prereq gap (< targetLevel 5)
        targetLevel: 5,
        confidenceScore: 0.5,
      },
    ] as any);

    // Mock current learning path with 3 items: res-1 (completed), res-2 (started), res-3 (pending)
    const mockCurrentPath = {
      id: 'path-v1',
      userId,
      version: 1,
      items: [
        {
          id: 'item-1',
          resourceId: 'res-1',
          status: 'completed',
          score: 0.9,
          scoreBreakdown: {},
          resource: {
            id: 'res-1',
            title: 'Intro to Math',
            skillsTaught: ['Math'],
            prerequisiteSkills: [],
            difficulty: 1,
            durationHours: 5,
            format: 'video',
          },
        },
        {
          id: 'item-2',
          resourceId: 'res-2',
          status: 'started',
          score: 0.8,
          scoreBreakdown: {},
          resource: {
            id: 'res-2',
            title: 'Advanced ML',
            skillsTaught: ['Machine Learning'],
            prerequisiteSkills: ['Linear Algebra'],
            difficulty: 4,
            durationHours: 10,
            format: 'video',
          },
        },
        {
          id: 'item-3',
          resourceId: 'res-3',
          status: 'pending',
          score: 0.85,
          scoreBreakdown: {},
          resource: {
            id: 'res-3',
            title: 'Deep Learning',
            skillsTaught: ['Deep Learning'],
            prerequisiteSkills: ['Machine Learning'],
            difficulty: 5,
            durationHours: 15,
            format: 'video',
          },
        },
      ],
    };

    vi.mocked(prisma.learningPath.findFirst).mockResolvedValue(mockCurrentPath as any);

    // Mock learningResource.findMany for remedial candidate lookup
    const remedialCandidate = {
      id: 'res-remedial-1',
      title: 'Linear Algebra Foundations',
      skillsTaught: ['Linear Algebra'],
      prerequisiteSkills: [],
      difficulty: 1,
      durationHours: 5,
      format: 'text',
    };
    vi.mocked(prisma.learningResource.findMany).mockResolvedValue([remedialCandidate as any]);

    (prisma.learningPath.create as any).mockImplementation(async (args: any) => {
      return {
        id: 'path-v2',
        version: args.data.version,
        userId: args.data.userId,
        triggerReason: args.data.triggerReason,
        estimatedWeeksToGoal: args.data.estimatedWeeksToGoal,
        generatedAt: new Date(),
        items: (args.data.items?.create || []).map((item: any, idx: number) => ({
          id: `item-v2-${idx}`,
          ...item,
        })),
      };
    });

    const request = new Request('http://localhost/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        resourceId: hardResourceId,
        eventType: 'too_hard',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.replanned).toBe(true);

    // Verify learningPath.create was called
    expect(prisma.learningPath.create).toHaveBeenCalledTimes(1);
    const createArgs: any = vi.mocked(prisma.learningPath.create).mock.calls[0][0];
    const createdItems: any[] = createArgs.data.items.create;

    // Item for res-1 must preserve status: 'completed'
    const res1Item = createdItems.find((it: any) => it.resourceId === 'res-1');
    expect(res1Item).toBeDefined();
    expect(res1Item.status).toBe('completed');

    // Item for res-2 (which was too_hard) should be reset to 'pending'
    const res2Item = createdItems.find((it: any) => it.resourceId === 'res-2');
    expect(res2Item).toBeDefined();
    expect(res2Item.status).toBe('pending');
  });
});
