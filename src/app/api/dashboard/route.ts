import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSkillGaps } from '@/lib/core/skillGap';
import { detectBottlenecks } from '@/lib/core/bottleneckDetection';
import { calculatePathwayMetrics } from '@/lib/core/onboardingMetrics';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      include: { goalTemplate: true }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const skills = await prisma.learnerSkill.findMany({ where: { userId } });
    
    // Gaps and Readiness
    let gapsResult: any = { gaps: [], readinessScore: 0, matchedSkills: [], missingSkills: [] };
    let bottleneck = null;

    if (profile.goalTemplate) {
      gapsResult = calculateSkillGaps(skills as any, profile.goalTemplate as any);
      const dependencies = await prisma.skillDependency.findMany();
      const bottlenecks = detectBottlenecks(gapsResult.gaps, dependencies as any);
      if (bottlenecks.length > 0) {
        bottleneck = bottlenecks[0];
      }
    }

    // Path History & Current Path
    const pathHistory = await prisma.learningPath.findMany({
      where: { userId },
      orderBy: { version: 'desc' },
      include: { items: { orderBy: { position: 'asc' } } }
    });

    const currentPath = pathHistory.length > 0 ? pathHistory[0] : null;
    let nextBestAction = null;
    let metrics = null;
    let progressStats = { completed: 0, started: 0, total: 0, percentage: 0 };

    let formattedPhases = [];
    if (currentPath) {
      const pendingItems = currentPath.items.filter(i => i.status === 'pending');
      if (pendingItems.length > 0) {
        nextBestAction = pendingItems[0];
      }

      progressStats.total = currentPath.items.length;
      progressStats.completed = currentPath.items.filter(i => i.status === 'completed').length;
      progressStats.started = currentPath.items.filter(i => i.status === 'started').length;
      progressStats.percentage = progressStats.total > 0 ? Math.round((progressStats.completed / progressStats.total) * 100) : 0;

      // Reconstruct phases for UI and metrics
      const phasesMap = new Map<number, any>();
      for (const item of currentPath.items) {
        if (!phasesMap.has(item.phase)) {
          phasesMap.set(item.phase, { id: `phase-${item.phase}`, phase: item.phase, title: item.phaseName, items: [], resources: [] });
        }
        phasesMap.get(item.phase).items.push(item);
      }
      const phases = Array.from(phasesMap.values()).sort((a, b) => a.phase - b.phase);

      const resourceIds = currentPath.items.map(i => i.resourceId);
      const resources = await prisma.learningResource.findMany({
        where: { id: { in: resourceIds } }
      });
      const resourceMap = new Map(resources.map(r => [r.id, r]));

      metrics = calculatePathwayMetrics(phases, gapsResult.readinessScore, profile.weeklyHours, resourceMap as any);

      // Attach actual resources to the phases array for the frontend Timeline component
      for (const phase of phases) {
        phase.resources = phase.items.map((item: any) => ({
          ...resourceMap.get(item.resourceId),
          _pathItem: item // attach status/reason for UI
        }));
      }

      formattedPhases = phases;
    }

    return NextResponse.json({
      profile: {
        goal: profile.goal,
        weeklyHours: profile.weeklyHours,
      },
      skillGaps: gapsResult.gaps,
      readinessScore: gapsResult.readinessScore,
      matchedSkills: gapsResult.matchedSkills,
      missingSkills: gapsResult.missingSkills,
      bottleneck,
      currentPath,
      formattedPhases,
      metrics,
      progress: progressStats,
      estimatedWeeksToGoal: currentPath?.estimatedWeeksToGoal || 0,
      pathHistory,
      nextBestAction,
    });

  } catch (error: any) {
    console.error('[API Dashboard]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
