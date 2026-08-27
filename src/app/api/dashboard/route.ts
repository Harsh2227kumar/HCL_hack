import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // 1. Fetch Learner Profile (Goal, etc.)
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Learner profile not found. Please complete onboarding.' },
        { status: 404 }
      );
    }

    // 2. Fetch Skill-Gap data (LearnerSkills)
    const skills = await prisma.learnerSkill.findMany({
      where: { userId },
      select: {
        skillName: true,
        finalEstimate: true,
        targetLevel: true,
        confidenceScore: true,
      },
    });

    // 3. Fetch Latest Learning Path with its items
    const latestPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
      include: {
        items: {
          orderBy: [{ phase: 'asc' }, { position: 'asc' }],
          include: {
            resource: {
              select: {
                id: true,
                title: true,
                type: true,
                difficulty: true,
                durationHours: true,
                format: true,
              },
            },
          },
        },
      },
    });

    // 4. Fetch Recent Progress Events (Timeline)
    const recentEvents = await prisma.progressEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        resource: {
          select: { title: true },
        },
      },
    });

    // 5. Compute "Next Best Action" (First pending item in the path)
    const nextBestAction = latestPath?.items.find((item) => item.status === 'pending') || null;

    // 6. MOCK: Bottleneck callout (Rudrakshi will implement the real logic later)
    // In reality, this would call bottleneckDetection.ts or read from a pre-computed field.
    const bottleneck = "Linear Algebra"; 
    
    // Assemble the Dashboard Payload
    const dashboardData = {
      goal: profile.goal,
      weeklyHours: profile.weeklyHours,
      skillGaps: skills.map(skill => ({
        skillName: skill.skillName,
        current: skill.finalEstimate,
        target: skill.targetLevel,
        gap: Math.max(0, skill.targetLevel - skill.finalEstimate),
        confidence: skill.confidenceScore,
      })),
      bottleneck,
      timeToGoalWeeks: latestPath?.estimatedWeeksToGoal || null,
      nextBestAction,
      activePath: latestPath ? {
        id: latestPath.id,
        version: latestPath.version,
        triggerReason: latestPath.triggerReason,
        generatedAt: latestPath.generatedAt,
        milestones: latestPath.items, // The frontend can group these by `phase`
      } : null,
      recentActivity: recentEvents,
      aiInsight: `Based on your goal to become a ${profile.goal}, resolving your bottleneck in ${bottleneck} should be your immediate priority.`
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching dashboard data.' },
      { status: 500 }
    );
  }
}
