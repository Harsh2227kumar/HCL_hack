import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { evaluateImpact, LearnerContext as ImpactLearnerContext, ProgressEvent as CoreProgressEvent, ProgressEventType } from '@/lib/core/impactEvaluator';
import { callAI } from '@/lib/ai/callAI';
import { prerequisiteSort, RankedResource, PhaseName } from '@/lib/core/prerequisiteSort';
import { scoreResource, LearnerContext as ScoringLearnerContext } from '@/lib/core/hybridScoring';
import skillDependenciesData from '../../../../data/skill_dependencies.json';

const AdaptationBannerSchema = z.object({
  banner: z.string().default('Your learning path has been adapted based on your latest activity.'),
});

const PHASE_NUMBERS: Record<string, number> = {
  Foundations: 1,
  Core: 2,
  'Applied Project': 3,
  Specialization: 4,
  Capstone: 5,
};

const PHASES: PhaseName[] = [
  'Foundations',
  'Core',
  'Applied Project',
  'Specialization',
  'Capstone',
];

type DbResource = Awaited<ReturnType<typeof prisma.learningResource.findFirst>>;

interface PrerequisiteSearchResult {
  insertedResource: DbResource;
  weakestSkill: string | null;
}

/**
 * Searches LearningResource for an easier resource teaching the weakest prerequisite
 * or foundational skill for the learner, excluding items already present in the current path.
 */
async function findRemedialPrerequisiteResource(
  currentResource: DbResource | { prerequisiteSkills?: unknown; skillsTaught?: unknown; difficulty?: unknown; title?: string },
  userSkills: Array<{ skillName: string; finalEstimate: number; targetLevel: number; confidenceScore: number }>,
  existingResourceIds: Set<string>,
  learnerContext: ScoringLearnerContext
): Promise<PrerequisiteSearchResult> {
  const prereqSkills: string[] = (currentResource?.prerequisiteSkills as string[]) || [];
  const skillsTaught: string[] = (currentResource?.skillsTaught as string[]) || [];
  const currentDifficulty = typeof currentResource?.difficulty === 'number' ? currentResource.difficulty : 3;

  // 1. Identify weakest prerequisite skill
  let weakestSkill: string | null = null;
  let lowestScore = Infinity;

  // Check explicit prerequisite skills first
  if (prereqSkills.length > 0) {
    for (const p of prereqSkills) {
      const sk = userSkills.find((s) => s.skillName.toLowerCase() === p.toLowerCase());
      const est = sk ? sk.finalEstimate : 0;
      if (est < lowestScore) {
        lowestScore = est;
        weakestSkill = p;
      }
    }
  }

  // If no explicit prerequisite skills, look up graph dependencies of skills taught
  if (!weakestSkill && skillsTaught.length > 0) {
    const deps = (skillDependenciesData as Array<{ skill_name: string; depends_on_skill_name: string }>)
      .filter((d) => skillsTaught.some((st) => st.toLowerCase() === d.skill_name.toLowerCase()))
      .map((d) => d.depends_on_skill_name);

    for (const dep of deps) {
      const sk = userSkills.find((s) => s.skillName.toLowerCase() === dep.toLowerCase());
      const est = sk ? sk.finalEstimate : 0;
      if (est < lowestScore) {
        lowestScore = est;
        weakestSkill = dep;
      }
    }
  }

  // If still no weakestSkill, check foundational skills taught by current resource
  if (!weakestSkill && skillsTaught.length > 0) {
    for (const st of skillsTaught) {
      const sk = userSkills.find((s) => s.skillName.toLowerCase() === st.toLowerCase());
      const est = sk ? sk.finalEstimate : 0;
      if (est < lowestScore) {
        lowestScore = est;
        weakestSkill = st;
      }
    }
  }

  // 2. Query available resources not already in current path
  const candidates = await prisma.learningResource.findMany({
    where: {
      id: {
        notIn: Array.from(existingResourceIds),
      },
    },
  });

  if (!candidates.length) {
    return { insertedResource: null, weakestSkill };
  }

  // Skills we want to remediate
  const targetSkills = [weakestSkill, ...prereqSkills].filter(Boolean) as string[];

  // 3. Score and rank candidates
  const scoredCandidates = candidates.map((cand) => {
    const candSkillsTaught = (cand.skillsTaught as string[]) || [];
    const candDiff = typeof cand.difficulty === 'number' ? cand.difficulty : 3;

    // Check if candidate teaches any targeted skill
    const teachesTarget = targetSkills.some((ts) =>
      candSkillsTaught.some(
        (cs) =>
          cs.toLowerCase() === ts.toLowerCase() ||
          cs.toLowerCase().includes(ts.toLowerCase()) ||
          ts.toLowerCase().includes(cs.toLowerCase())
      )
    );

    // Check if candidate teaches exact weakest skill
    const teachesWeakest = weakestSkill
      ? candSkillsTaught.some(
          (cs) =>
            cs.toLowerCase() === weakestSkill!.toLowerCase() ||
            cs.toLowerCase().includes(weakestSkill!.toLowerCase()) ||
            weakestSkill!.toLowerCase().includes(cs.toLowerCase())
        )
      : false;

    // Is candidate easier?
    const isEasier = candDiff < currentDifficulty;
    const isSameDiffIfBeginner = currentDifficulty <= 2 && candDiff <= currentDifficulty;
    const diffBonus = isEasier ? 2.0 : isSameDiffIfBeginner ? 1.0 : -1.0;

    // Score using hybrid scoring
    const hybrid = scoreResource(
      {
        id: cand.id,
        skills_taught: candSkillsTaught,
        prerequisite_skills: (cand.prerequisiteSkills as string[]) || [],
        difficulty: candDiff,
        duration_hours: cand.durationHours ?? undefined,
        format: cand.format ?? undefined,
      },
      learnerContext,
      0.8
    );

    let priorityScore = hybrid.score;
    if (teachesWeakest) priorityScore += 4.0;
    else if (teachesTarget) priorityScore += 2.0;
    priorityScore += diffBonus;

    return {
      resource: cand,
      teachesTarget: teachesTarget || teachesWeakest,
      isEasier: isEasier || isSameDiffIfBeginner,
      priorityScore,
      hybridScore: hybrid.score,
    };
  });

  // Filter to candidates that teach target skills
  const validMatches = scoredCandidates.filter((c) => c.teachesTarget);

  if (validMatches.length > 0) {
    validMatches.sort((a, b) => b.priorityScore - a.priorityScore);
    return {
      insertedResource: validMatches[0].resource,
      weakestSkill,
    };
  }

  // If no direct target skill match, look for any easier foundational resource
  const foundationalMatches = scoredCandidates.filter((c) => c.isEasier && c.priorityScore > 0);
  if (foundationalMatches.length > 0) {
    foundationalMatches.sort((a, b) => b.priorityScore - a.priorityScore);
    return {
      insertedResource: foundationalMatches[0].resource,
      weakestSkill,
    };
  }

  return { insertedResource: null, weakestSkill };
}

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

    // Fetch existing user skills
    const userSkills = await prisma.learnerSkill.findMany({
      where: { userId },
    });

    const prereqSkills: string[] = (resource?.prerequisiteSkills as string[]) || [];
    let hasPrereqGap = false;
    prereqSkills.forEach((pSkill) => {
      const userSk = userSkills.find((s) => s.skillName.toLowerCase() === pSkill.toLowerCase());
      if (!userSk || userSk.finalEstimate < userSk.targetLevel) {
        hasPrereqGap = true;
      }
    });

    // 2.5 Real BKT Wiring — Update skills based on this progress event
    let bktEvent: { correct: boolean } | null = null;
    if (eventType === 'completed') bktEvent = { correct: true };
    else if (eventType === 'too_hard' || eventType === 'struggling') bktEvent = { correct: false };

    if (bktEvent && resource?.skillsTaught) {
      const { bktUpdate, BKT_PARAMS } = await import('@/lib/core/reconciliation');
      const skillsTaught = resource.skillsTaught as string[];

      for (const skillName of skillsTaught) {
        const existingSkill = userSkills.find((s) => s.skillName.toLowerCase() === skillName.toLowerCase());

        const priorKnown = existingSkill ? existingSkill.finalEstimate / 5 : BKT_PARAMS.P_L0;
        const newPKnown = bktUpdate(priorKnown, bktEvent.correct);
        const newFinalEstimate = newPKnown * 5; // Scale [0,1] back to 0-5

        if (existingSkill) {
          await prisma.learnerSkill.update({
            where: { id: existingSkill.id },
            data: {
              finalEstimate: newFinalEstimate,
              lastAssessed: new Date(),
            },
          });
          // Update in-memory userSkills representation as well
          existingSkill.finalEstimate = newFinalEstimate;
        } else {
          const createdSkill = await prisma.learnerSkill.create({
            data: {
              userId,
              skillName,
              selfRatedLevel: 0,
              finalEstimate: newFinalEstimate,
              targetLevel: 5,
              confidenceScore: 0.5,
              lastAssessed: new Date(),
            },
          });
          userSkills.push(createdSkill);
        }
      }
    }

    const rawDiagScore = recentDiagnostic?.score ?? (score ?? null);

    const context: ImpactLearnerContext = {
      hasPrereqGap,
      recentDiagnosticNormalizedScore: rawDiagScore != null ? rawDiagScore / 5 : null,
      resourceDifficulty: resource?.difficulty ?? 3,
      learnerExperienceLevel: profile?.experienceLevel || 'Intermediate',
      formatMismatch: false,
    };

    // 3. Evaluate impact with deterministic impactEvaluator
    const coreEvent: CoreProgressEvent = {
      eventType: eventType as ProgressEventType,
      resourceId,
      score: score ?? null,
    };
    const impact = evaluateImpact(coreEvent, context);

    const isTooHard = eventType === 'too_hard';
    const shouldReplan = isTooHard || impact.replan;

    if (!shouldReplan) {
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
            status:
              eventType === 'completed'
                ? 'completed'
                : eventType === 'skipped'
                ? 'skipped'
                : 'started',
          },
        });
      }

      return NextResponse.json({
        event: progressRecord,
        replanned: false,
      });
    }

    // 4. Replan flow: Fetch latest path & items
    const currentPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
      include: { items: { include: { resource: true } } },
    });

    const currentVersion = currentPath?.version ?? 0;
    const newVersion = currentVersion + 1;

    const existingResourceIds = new Set((currentPath?.items || []).map((item) => item.resourceId));

    const scoringLearnerCtx: ScoringLearnerContext = {
      skillEstimates: userSkills.map((s) => ({
        skill_name: s.skillName,
        final_estimate: s.finalEstimate,
      })),
      weeklyHours: profile?.weeklyHours ?? 10,
      learningStyle: profile?.learningStyle ?? 'visual',
      pastFeedback: [{ resource_id: resourceId, event_type: eventType }],
    };

    let insertedResource: Awaited<ReturnType<typeof findRemedialPrerequisiteResource>>['insertedResource'] = null;
    let weakestSkill: string | null = null;

    if (isTooHard) {
      const searchResult = await findRemedialPrerequisiteResource(
        resource,
        userSkills,
        existingResourceIds,
        scoringLearnerCtx
      );
      insertedResource = searchResult.insertedResource;
      weakestSkill = searchResult.weakestSkill;
    }

    // 5. Convert items into candidates for prerequisiteSort
    const candidates: RankedResource[] = (currentPath?.items || []).map((item) => ({
      resourceId: item.resourceId,
      score: item.score ?? 0.8,
      scoreBreakdown: (item.scoreBreakdown as object) ?? {},
      skillsTaught: (item.resource?.skillsTaught as string[]) || [],
      prerequisiteSkills: (item.resource?.prerequisiteSkills as string[]) || [],
      durationHours: item.resource?.durationHours ?? 5,
      difficulty: item.resource?.difficulty ?? 3,
    }));

    if (insertedResource) {
      candidates.push({
        resourceId: insertedResource.id,
        score: 0.95,
        scoreBreakdown: {
          skill_gap_match: 1.0,
          prerequisite_fit: 1.0,
          difficulty_fit: 1.0,
          time_fit: 1.0,
          learning_style_fit: 1.0,
        },
        skillsTaught: (insertedResource.skillsTaught as string[]) || [],
        prerequisiteSkills: (insertedResource.prerequisiteSkills as string[]) || [],
        durationHours: insertedResource.durationHours ?? 5,
        difficulty: insertedResource.difficulty ?? 2,
      });
    }

    const weeklyHours = profile?.weeklyHours ?? 10;
    const sortedPath = prerequisiteSort(candidates, weeklyHours);

    // Ensure that if an inserted prerequisite resource exists, it appears before the hard resource
    if (insertedResource) {
      const insertedIdx = sortedPath.items.findIndex((i) => i.resourceId === insertedResource.id);
      const hardIdx = sortedPath.items.findIndex((i) => i.resourceId === resourceId);
      if (insertedIdx !== -1 && hardIdx !== -1 && insertedIdx > hardIdx) {
        const [movedItem] = sortedPath.items.splice(insertedIdx, 1);
        sortedPath.items.splice(hardIdx, 0, movedItem);
        sortedPath.items.forEach((it, idx) => {
          it.position = idx + 1;
          const phaseIndex = Math.min(Math.floor((idx / sortedPath.items.length) * 5), 4);
          it.phase = PHASES[phaseIndex];
        });
      }
    }

    // 6. Generate adaptation banner prose
    let adaptationReason: string;
    if (insertedResource) {
      adaptationReason = `Adapted path: Added foundational resource "${insertedResource.title}" to build mastery in ${weakestSkill || 'prerequisites'} before tackling "${resource?.title || resourceId}".`;
      try {
        const prompt = `Explain why the learner's path is being adapted.
Event: Marked as too hard on resource "${resource?.title || resourceId}".
Action taken: Inserted prerequisite resource "${insertedResource.title}" teaching ${weakestSkill || 'foundational skills'} before "${resource?.title || resourceId}".
Write 1 encouraging, concise 1-2 sentence adaptation banner.`;
        const aiBanner = await callAI('writing', prompt, AdaptationBannerSchema);
        if (!Array.isArray(aiBanner) && aiBanner?.data?.banner) {
          adaptationReason = aiBanner.data.banner;
        }
      } catch {
        console.warn('[progress] Fallback adaptation banner used.');
      }
    } else if (isTooHard) {
      adaptationReason = `No new prerequisite resource found; reordered learning path to optimize prerequisite flow after "${resource?.title || resourceId}".`;
    } else {
      adaptationReason = `Path adapted (${impact.cause || 'progress update'}): updated resource sequence.`;
      try {
        const prompt = `Explain why the learner's path is being adapted.
Event: ${eventType} on resource "${resource?.title || resourceId}".
Cause: ${impact.cause}. Action taken: ${impact.action}.
Write 1 clear, encouraging 1-2 sentence adaptation banner.`;
        const aiBanner = await callAI('writing', prompt, AdaptationBannerSchema);
        if (!Array.isArray(aiBanner) && aiBanner?.data?.banner) {
          adaptationReason = aiBanner.data.banner;
        }
      } catch {
        console.warn('[progress] Fallback adaptation banner used.');
      }
    }

    // 7. Persist new learning path in database
    const newPath = await prisma.learningPath.create({
      data: {
        userId,
        version: newVersion,
        triggerReason: eventType,
        estimatedWeeksToGoal: sortedPath.estimatedWeeksToGoal,
        items: {
          create: sortedPath.items.map((item) => {
            if (insertedResource && item.resourceId === insertedResource.id) {
              return {
                resourceId: item.resourceId,
                phase: PHASE_NUMBERS[item.phase] || 1,
                position: item.position,
                status: 'pending',
                reason: `Prerequisite reinforcement: Focuses on foundational ${weakestSkill || 'skills'} to prepare for ${resource?.title || 'next topics'}.`,
                score: 0.95,
                scoreBreakdown: {
                  skill_gap_match: 1.0,
                  prerequisite_fit: 1.0,
                  difficulty_fit: 1.0,
                  time_fit: 1.0,
                  learning_style_fit: 1.0,
                },
              };
            }

            const original = currentPath?.items.find((i) => i.resourceId === item.resourceId);
            return {
              resourceId: item.resourceId,
              phase: PHASE_NUMBERS[item.phase] || 1,
              position: item.position,
              status:
                item.resourceId === resourceId
                  ? isTooHard
                    ? 'pending'
                    : eventType === 'completed'
                    ? 'completed'
                    : 'skipped'
                  : original?.status || 'pending',
              reason: original?.reason || `Adapted for ${item.phase} phase.`,
              score: original?.score ?? 0.8,
              scoreBreakdown: (original?.scoreBreakdown as Prisma.InputJsonValue) ?? {},
            };
          }),
        },
      },
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

    return NextResponse.json({
      event: progressRecord,
      replanned: true,
      adaptationReason,
      insertedResourceId: insertedResource ? insertedResource.id : undefined,
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
