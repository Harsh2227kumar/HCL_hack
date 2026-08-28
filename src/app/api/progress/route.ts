import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { evaluateImpact, LearnerContext, ProgressEvent as CoreProgressEvent } from '@/lib/core/impactEvaluator';
import { callAI } from '@/lib/ai/callAI';
import { prerequisiteSort, RankedResource } from '@/lib/core/prerequisiteSort';

const AdaptationBannerSchema = z.object({
  banner: z.string().default('Your learning path has been adapted based on your latest activity.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, resourceId, eventType, score } = body;

    if (!userId || !resourceId || !eventType) {
      return NextResponse.json(
        { error: 'userId, resourceId, and eventType are required' },
        { status: 400 }
      );
    }

    // 1. Create ProgressEvent record in Prisma
    const progressRecord = await prisma.progressEvent.create({
      data: {
        userId,
        resourceId,
        eventType,
        score: score ?? null,
      },
    });

    // 2. Build LearnerContext from database queries
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
    });

    const resource = await prisma.learningResource.findUnique({
      where: { id: resourceId },
    });

    const recentDiagnostic = await prisma.skillEvidence.findFirst({
      where: { userId, source: 'diagnostic' },
      orderBy: { timestamp: 'desc' },
    });

    // Check if prerequisite skills for this resource are missing or below target level
    const userSkills = await prisma.learnerSkill.findMany({
      where: { userId },
    });

    const prereqSkills: string[] = (resource?.prerequisiteSkills as string[]) || [];
    let hasPrereqGap = false;
    prereqSkills.forEach((pSkill) => {
      const userSk = userSkills.find((s) => s.skillName === pSkill);
      if (!userSk || userSk.finalEstimate < userSk.targetLevel) {
        hasPrereqGap = true;
      }
    });

    // 2.5 Real BKT Wiring — Update skills based on this progress event
    // Map eventType to correct/incorrect for BKT
    // Note: Upfront diagnostic quiz wiring is out of scope for Part 1. 
    // This uses progress events to post-hoc update BKT using the cold-start prior if no row exists yet.
    let bktEvent: { correct: boolean } | null = null;
    if (eventType === 'completed') bktEvent = { correct: true };
    else if (eventType === 'too_hard' || eventType === 'struggling') bktEvent = { correct: false };
    
    if (bktEvent && resource?.skillsTaught) {
      const { bktUpdate, BKT_PARAMS } = await import('@/lib/core/reconciliation');
      const skillsTaught = resource.skillsTaught as string[];
      
      for (const skillName of skillsTaught) {
        let existingSkill = userSkills.find(s => s.skillName === skillName);
        
        let priorKnown = existingSkill ? (existingSkill.finalEstimate / 5) : BKT_PARAMS.P_L0;
        let newPKnown = bktUpdate(priorKnown, bktEvent.correct);
        let newFinalEstimate = newPKnown * 5; // Scale [0,1] back to 0-5
        
        if (existingSkill) {
          await prisma.learnerSkill.update({
            where: { id: existingSkill.id },
            data: { 
              finalEstimate: newFinalEstimate,
              lastAssessed: new Date()
            }
          });
        } else {
          await prisma.learnerSkill.create({
            data: {
              userId,
              skillName,
              selfRatedLevel: 0,
              finalEstimate: newFinalEstimate,
              targetLevel: 5,
              confidenceScore: 0.5,
              lastAssessed: new Date()
            }
          });
        }
      }
    }

    const context: LearnerContext = {
      hasPrereqGap,
      recentDiagnosticScore: recentDiagnostic?.score ?? (score ?? null),
      resourceDifficulty: resource?.difficulty ?? 3,
      learnerExperienceLevel: profile?.learningStyle || 'Intermediate',
      formatMismatch: false,
    };

    // 3. Evaluate impact with deterministic impactEvaluator
    const coreEvent: CoreProgressEvent = {
      eventType: eventType as any,
      resourceId,
      score: score ?? null,
    };
    const impact = evaluateImpact(coreEvent, context);

    if (!impact.replan) {
      const latestPath = await prisma.learningPath.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
      });
      if (latestPath) {
        await prisma.learningPathItem.updateMany({
          where: {
            pathId: latestPath.id,
            resourceId: resourceId,
          },
          data: {
            status: eventType === 'completed' ? 'completed' : eventType === 'skipped' ? 'skipped' : 'started',
          },
        });
      }

      return NextResponse.json({
        event: progressRecord,
        replanned: false,
      });
    }

    // 4. Replan triggered: generate adaptation banner prose via callAI
    const prompt = `Explain why the learner's path is being adapted.
Event: ${eventType} on resource "${resource?.title || resourceId}".
Cause: ${impact.cause}. Action taken: ${impact.action}.
Write 1 clear, encouraging 1-2 sentence adaptation banner.`;

    let adaptationReason = `Path adapted (${impact.cause}): updated resource sequence.`;
    try {
      const aiBanner = await callAI('writing', prompt, AdaptationBannerSchema);
      if (!Array.isArray(aiBanner) && aiBanner?.data?.banner) {
        adaptationReason = aiBanner.data.banner;
      }
    } catch (e) {
      console.warn('[progress] Fallback adaptation banner used.');
    }

    // 5. Fetch latest path & items to re-sort / adapt
    const currentPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
      include: { items: { include: { resource: true } } },
    });

    const currentVersion = currentPath?.version ?? 0;
    const newVersion = currentVersion + 1;

    // Convert items into candidates for prerequisiteSort
    const candidates: RankedResource[] = (currentPath?.items || []).map((item) => ({
      resourceId: item.resourceId,
      score: item.score ?? 0.8,
      scoreBreakdown: (item.scoreBreakdown as object) ?? {},
      skillsTaught: (item.resource?.skillsTaught as string[]) || [],
      prerequisiteSkills: (item.resource?.prerequisiteSkills as string[]) || [],
      durationHours: item.resource?.durationHours ?? 5,
      difficulty: item.resource?.difficulty ?? 3,
    }));

    const weeklyHours = profile?.weeklyHours ?? 10;
    const sortedPath = prerequisiteSort(candidates, weeklyHours);

    const PHASE_NUMBERS: Record<string, number> = {
      'Foundations': 1,
      'Core': 2,
      'Applied Project': 3,
      'Specialization': 4,
      'Capstone': 5,
    };

    const newPath = await prisma.learningPath.create({
      data: {
        userId,
        version: newVersion,
        triggerReason: eventType,
        estimatedWeeksToGoal: sortedPath.estimatedWeeksToGoal,
        items: {
          create: sortedPath.items.map((item) => {
            const original = currentPath?.items.find((i) => i.resourceId === item.resourceId);
            return {
              resourceId: item.resourceId,
              phase: PHASE_NUMBERS[item.phase] || 1,
              position: item.position,
              status: item.resourceId === resourceId ? (eventType === 'completed' ? 'completed' : 'skipped') : 'pending',
              reason: original?.reason || `Adapted for ${item.phase} phase.`,
              score: original?.score ?? 0.8,
              scoreBreakdown: (original?.scoreBreakdown as any) ?? {},
            };
          }),
        },
      },
      include: {
        items: {
          orderBy: { position: 'asc' },
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

    return NextResponse.json({
      event: progressRecord,
      replanned: true,
      adaptationReason,
      newPath,
    });
  } catch (error) {
    console.error('Error in /api/progress:', error);
    return NextResponse.json(
      { error: 'Failed to record progress event' },
      { status: 500 }
    );
  }
}
