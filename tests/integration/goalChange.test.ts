import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { POST } from '../../src/app/api/goal/change/route';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    goalTemplate: {
      findUnique: vi.fn(),
    },
    learnerSkill: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    learnerProfile: {
      upsert: vi.fn(),
    },
    learningPath: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    progressEvent: {
      findMany: vi.fn(),
    },
    learningResource: {
      findMany: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
  },
}));

describe('Goal Change API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('regenerates a populated learning path with gap analysis and completed work preservation', async () => {
    const userId = 'user-goal-1';
    const newGoalName = 'Backend Engineer';

    // Mock goalTemplate
    vi.mocked(prisma.goalTemplate.findUnique).mockResolvedValue({
      id: 'template-1',
      goalName: newGoalName,
      requiredSkills: [
        { skill: 'JavaScript', min_level: 3 },
        { skill: 'Node.js', min_level: 4 },
        { skill: 'PostgreSQL', min_level: 3 },
      ],
    } as any);

    // Mock initial learnerSkill findMany (user has JS at level 4, Node at level 1)
    vi.mocked(prisma.learnerSkill.findMany)
      .mockResolvedValueOnce([
        {
          id: 'sk-js',
          userId,
          skillName: 'JavaScript',
          finalEstimate: 4.0,
          selfRatedLevel: 4,
          targetLevel: 3,
          confidenceScore: 0.8,
        },
        {
          id: 'sk-node',
          userId,
          skillName: 'Node.js',
          finalEstimate: 1.0,
          selfRatedLevel: 1,
          targetLevel: 2,
          confidenceScore: 0.5,
        },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 'sk-js',
          userId,
          skillName: 'JavaScript',
          finalEstimate: 4.0,
          targetLevel: 3,
          confidenceScore: 0.8,
        },
        {
          id: 'sk-node',
          userId,
          skillName: 'Node.js',
          finalEstimate: 1.0,
          targetLevel: 4,
          confidenceScore: 0.5,
        },
        {
          id: 'sk-pg',
          userId,
          skillName: 'PostgreSQL',
          finalEstimate: 0.0,
          targetLevel: 3,
          confidenceScore: 0.0,
        },
      ] as any);

    // Mock learnerSkill.upsert
    vi.mocked(prisma.learnerSkill.upsert).mockResolvedValue({} as any);

    // Mock learnerProfile.upsert
    vi.mocked(prisma.learnerProfile.upsert).mockResolvedValue({
      id: 'profile-1',
      userId,
      goal: newGoalName,
      weeklyHours: 10,
      learningStyle: 'visual',
    } as any);

    // Mock previous path with completed item res-1
    vi.mocked(prisma.learningPath.findFirst).mockResolvedValue({
      id: 'path-old',
      userId,
      version: 1,
      items: [
        {
          id: 'item-old-1',
          resourceId: 'res-js-1',
          status: 'completed',
        },
      ],
    } as any);

    // Mock progressEvent.findMany
    vi.mocked(prisma.progressEvent.findMany).mockResolvedValue([]);

    // Mock pgvector query failure to trigger DB fallback
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('No pgvector'));

    // Mock learningResource.findMany
    const dbResources = [
      {
        id: 'res-js-1',
        title: 'JS Core',
        type: 'course',
        provider: 'Curated',
        skillsTaught: ['JavaScript'],
        prerequisiteSkills: [],
        difficulty: 2,
        durationHours: 5,
        format: 'video',
      },
      {
        id: 'res-node-1',
        title: 'Node.js Masterclass',
        type: 'course',
        provider: 'Curated',
        skillsTaught: ['Node.js'],
        prerequisiteSkills: ['JavaScript'],
        difficulty: 3,
        durationHours: 10,
        format: 'video',
      },
    ];
    vi.mocked(prisma.learningResource.findMany).mockResolvedValue(dbResources as any);

    // Mock learningPath.create
    (prisma.learningPath.create as any).mockImplementation(async (args: any) => ({
      id: 'path-new',
      version: args.data.version,
      userId: args.data.userId,
      triggerReason: args.data.triggerReason,
      estimatedWeeksToGoal: args.data.estimatedWeeksToGoal,
      items: (args.data.items?.create || []).map((item: any, idx: number) => ({
        id: `item-new-${idx}`,
        ...item,
      })),
    }));

    const request = new Request('http://localhost/api/goal/change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        newGoalName,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // Check gap analysis
    expect(body.gapAnalysis.transferableSkills).toContain('JavaScript');
    expect(body.gapAnalysis.newGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ skill: 'Node.js', targetLevel: 4 }),
        expect.objectContaining({ skill: 'PostgreSQL', targetLevel: 3 }),
      ])
    );

    // Check newPath
    expect(body.newPath).toBeDefined();
    expect(body.newPath.triggerReason).toBe('goal_change');
    expect(body.newPath.items.length).toBeGreaterThan(0);

    // Verify res-js-1 preserved status: 'completed'
    const completedItem = body.newPath.items.find((it: any) => it.resourceId === 'res-js-1');
    expect(completedItem).toBeDefined();
    expect(completedItem.status).toBe('completed');
  });
});
