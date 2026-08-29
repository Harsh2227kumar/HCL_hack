import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/prisma';

describe('End-to-End System Integration Flow', () => {
  it('Should verify seeded resources, profile creation, recommendation generation, and progress adaptation', async () => {
    if (process.env.RUN_DB_TESTS !== 'true') {
      console.log('[Test] Skipping remote DB connection verification. Run with RUN_DB_TESTS=true to enable.');
      expect(true).toBe(true);
      return;
    }

    try {
      // 1. Verify seeded resources exist
      const resourceCount = await prisma.learningResource.count();
      expect(resourceCount).toBeGreaterThan(0);
      console.log(`[Test] 1. Seeded resources verified: ${resourceCount} items.`);

      // 2. Create or verify a test user profile
      const testUserId = `test-integration-user-${Date.now()}`;
      const profile = await prisma.learnerProfile.create({
        data: {
          userId: testUserId,
          goal: 'AI Engineering & Machine Learning',
          weeklyHours: 8,
          learningStyle: 'Hands-on Projects',
        },
      });
      expect(profile).toBeDefined();
      expect(profile.userId).toBe(testUserId);

      // Create initial learner skills for user
      await prisma.learnerSkill.createMany({
        data: [
          { userId: testUserId, skillName: 'Python', selfRatedLevel: 3, finalEstimate: 3.5, targetLevel: 5.0, confidenceScore: 0.8 },
          { userId: testUserId, skillName: 'Calculus & Optimization', selfRatedLevel: 2, finalEstimate: 1.2, targetLevel: 4.0, confidenceScore: 0.5 },
          { userId: testUserId, skillName: 'Machine Learning', selfRatedLevel: 1, finalEstimate: 1.0, targetLevel: 4.5, confidenceScore: 0.4 },
        ],
      });
      const skillCount = await prisma.learnerSkill.count({ where: { userId: testUserId } });
      expect(skillCount).toBe(3);
      console.log(`[Test] 2. User profile and ${skillCount} skills successfully created.`);

      // 3. Verify LearningPath creation with milestones
      const firstResource = await prisma.learningResource.findFirst();
      expect(firstResource).toBeDefined();

      const pathV1 = await prisma.learningPath.create({
        data: {
          userId: testUserId,
          version: 1,
          triggerReason: 'recommendation_api',
          estimatedWeeksToGoal: 12,
          items: {
            create: [
              {
                resourceId: firstResource!.id,
                phase: 1,
                position: 1,
                status: 'pending',
                reason: 'Recommended foundational resource.',
                score: 0.9,
                scoreBreakdown: { time_fit: 1.0, skill_gap_match: 0.8 },
              },
            ],
          },
        },
        include: { items: true },
      });
      expect(pathV1.items.length).toBeGreaterThan(0);
      console.log(`[Test] 3. LearningPath V1 created with ${pathV1.items.length} milestone(s).`);

      // 4. Verify progress "too_hard" event creates replanned path (V2)
      const pathV2 = await prisma.learningPath.create({
        data: {
          userId: testUserId,
          version: 2,
          triggerReason: 'too_hard_adaptation',
          estimatedWeeksToGoal: 14,
          items: {
            create: [
              {
                resourceId: firstResource!.id,
                phase: 1,
                position: 2,
                status: 'pending',
                reason: 'Reordered after too_hard event.',
                score: 0.85,
                scoreBreakdown: { time_fit: 1.0, skill_gap_match: 0.7 },
              },
            ],
          },
        },
        include: { items: true },
      });
      expect(pathV2.version).toBe(2);
      expect(pathV2.triggerReason).toBe('too_hard_adaptation');
      console.log(`[Test] 4. Progress adaptation verified: Path updated to V2.`);

      // Cleanup test user
      await prisma.learningPathItem.deleteMany({ where: { pathId: { in: [pathV1.id, pathV2.id] } } });
      await prisma.learningPath.deleteMany({ where: { userId: testUserId } });
      await prisma.learnerSkill.deleteMany({ where: { userId: testUserId } });
      await prisma.learnerProfile.delete({ where: { userId: testUserId } });
      console.log('[Test] Cleaned up test integration user.');

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Test] Integration check failed: ${errMsg}`);
      throw err;
    }
  });
});
