import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, newGoalName } = body;

    if (!userId || !newGoalName) {
      return NextResponse.json(
        { error: 'userId and newGoalName are required' },
        { status: 400 }
      );
    }

    // 1. Look up GoalTemplate
    const template = await prisma.goalTemplate.findUnique({
      where: { goalName: newGoalName },
    });

    const requiredSkills: Array<{ skill: string; min_level: number }> =
      (template?.requiredSkills as Array<{ skill: string; min_level: number }>) || [
        { skill: 'JavaScript', min_level: 3 },
        { skill: 'React', min_level: 3 },
        { skill: 'Node.js', min_level: 2 },
      ];

    // 2. Fetch existing user skills
    const existingSkills = await prisma.learnerSkill.findMany({
      where: { userId },
    });

    const transferableSkills: string[] = [];
    const newGaps: Array<{ skill: string; currentLevel: number; targetLevel: number }> = [];

    requiredSkills.forEach((req) => {
      const userSkill = existingSkills.find((s) => s.skillName === req.skill);
      const currentLevel = userSkill?.finalEstimate ?? userSkill?.selfRatedLevel ?? 0;

      if (userSkill && currentLevel >= req.min_level) {
        transferableSkills.push(req.skill);
      } else {
        newGaps.push({
          skill: req.skill,
          currentLevel,
          targetLevel: req.min_level,
        });
      }
    });

    // 3. Update profile goal
    await prisma.learnerProfile.upsert({
      where: { userId },
      update: { goal: newGoalName },
      create: { userId, goal: newGoalName },
    });

    // 4. Create new LearningPath version with triggerReason: 'goal_change'
    const lastPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastPath?.version ?? 0) + 1;

    const newPath = await prisma.learningPath.create({
      data: {
        userId,
        version: nextVersion,
        triggerReason: 'goal_change',
        estimatedWeeksToGoal: Math.max(2, newGaps.length * 2),
      },
    });

    return NextResponse.json({
      success: true,
      gapAnalysis: {
        transferableSkills,
        newGaps,
      },
      newPath,
    });
  } catch (error) {
    console.error('Error in /api/goal/change:', error);
    return NextResponse.json(
      { error: 'Failed to change goal and adapt path' },
      { status: 500 }
    );
  }
}
