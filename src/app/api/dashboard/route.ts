import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  detectBottleneck,
  SkillMastery,
  SkillDependency,
} from '@/lib/core/bottleneckDetection';
import skillDependenciesData from '../../../../data/skill_dependencies.json';

/**
 * GET /api/dashboard — Read-only aggregator for a returning user's dashboard.
 *
 * Reads the EXISTING profile, stored learning path, skill gaps, and progress
 * from the database. Does NOT regenerate or recompute the path — that's
 * /api/recommend's job.
 *
 * The only computation here is bottleneck detection, which runs against
 * the already-stored LearnerSkill.finalEstimate values (produced by BKT
 * reconciliation in /api/diagnostic/submit or /api/skills/reconcile).
 */
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

    // 1. Fetch Learner Profile
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
                skillsTaught: true,
                prerequisiteSkills: true,
              },
            },
          },
        },
      },
    });

    // 4. Fetch Recent Progress Events
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

    const phaseNames = ['Foundations', 'Core', 'Applied Project', 'Specialization', 'Capstone'];

    // 5. Next Best Action (first pending item in path)
    const nextBestActionItem = latestPath?.items.find(
      (item) => item.status === 'pending'
    ) || null;

    const nextBestAction = nextBestActionItem
      ? {
          id: nextBestActionItem.resourceId,
          status: nextBestActionItem.status,
          phase: phaseNames[nextBestActionItem.phase - 1] || 'Foundations',
          resource: {
            title: (nextBestActionItem as any).resource?.title || 'Unknown Resource',
            durationHours: (nextBestActionItem as any).resource?.durationHours || 5,
            format: (nextBestActionItem as any).resource?.format || 'course',
            skillsTaught: (nextBestActionItem as any).resource?.skillsTaught || [],
            prerequisiteSkills: (nextBestActionItem as any).resource?.prerequisiteSkills || [],
          },
          reason: nextBestActionItem.reason,
          score: nextBestActionItem.score,
          scoreBreakdown: nextBestActionItem.scoreBreakdown || {},
          recommendation_status: nextBestActionItem.reason,
        }
      : null;

    // 6. Real bottleneck detection using BKT-derived P(known) values
    const skillGaps = skills.map((skill) => ({
      skillName: skill.skillName,
      current: skill.finalEstimate,
      target: skill.targetLevel,
      gap: Math.max(0, skill.targetLevel - skill.finalEstimate),
      confidence: skill.confidenceScore,
    }));

    const skillMasteries: SkillMastery[] = skills.map((s) => ({
      skillName: s.skillName,
      pKnown: s.finalEstimate / 5, // Convert 0–5 scale to P(known) [0,1]
    }));

    const dependencies: SkillDependency[] = (skillDependenciesData as any[]).map(
      (d) => ({
        skill_name: d.skill_name,
        depends_on_skill_name: d.depends_on_skill_name,
      })
    );

    const bottleneckResult = detectBottleneck(skillMasteries, dependencies);
    const bottleneck = bottleneckResult.skill_name;

    // 7. Assemble the Dashboard Payload
    const aiInsight = bottleneck
      ? `Based on your goal to become a ${profile.goal}, resolving your bottleneck in ${bottleneck} should be your immediate priority. It blocks ${bottleneckResult.downstream_count} downstream skill${bottleneckResult.downstream_count !== 1 ? 's' : ''}.`
      : `Based on your goal to become a ${profile.goal}, you're making good progress across all tracked skills. Continue with your current path.`;

    const dashboardData = {
      goal: profile.goal,
      weeklyHours: profile.weeklyHours,
      skillGaps,
      bottleneck,
      timeToGoalWeeks: latestPath?.estimatedWeeksToGoal || null,
      nextBestAction,
      activePath: latestPath
        ? {
            id: latestPath.id,
            version: latestPath.version,
            triggerReason: latestPath.triggerReason,
            generatedAt: latestPath.generatedAt,
            milestones: latestPath.items.map((item) => ({
              id: item.resourceId,
              status: item.status,
              phase: phaseNames[item.phase - 1] || 'Foundations',
              resource: {
                title: (item as any).resource?.title || 'Unknown Resource',
                durationHours: (item as any).resource?.durationHours || 5,
                format: (item as any).resource?.format || 'course',
                skillsTaught: (item as any).resource?.skillsTaught || [],
                prerequisiteSkills: (item as any).resource?.prerequisiteSkills || [],
              },
              reason: item.reason,
              score: item.score,
              scoreBreakdown: item.scoreBreakdown || {},
              recommendation_status: item.reason,
            })),
          }
        : null,
      recentActivity: recentEvents,
      aiInsight,
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
