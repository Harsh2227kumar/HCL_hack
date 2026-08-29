import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { evaluateImpact, LearnerContext as ImpactLearnerContext, ProgressEvent as CoreProgressEvent, ProgressEventType } from '../../../lib/core/impactEvaluator';
import { callAI } from '../../../lib/ai/callAI';
import { prerequisiteSort, RankedResource, PhaseName } from '../../../lib/core/prerequisiteSort';
import { scoreResource, LearnerContext as ScoringLearnerContext } from '../../../lib/core/hybridScoring';
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

import {
  findRemedialPrerequisiteResource,
  findHarderAlternative,
  findDifferentFormatAlternative,
} from '../../../lib/core/resourceReplacement';
import { groundingCheck } from '../../../lib/validation/groundingCheck';

function computeFormatFit(learningStyle: string | null | undefined, resourceFormat: string | null | undefined): number {
  if (!learningStyle || !resourceFormat) return 0.7; // unknown = assume acceptable
  const style = learningStyle.toLowerCase();
  const format = resourceFormat.toLowerCase();
  const goodMatches: Record<string, string[]> = {
    visual: ['video'],
    reading: ['article', 'text'],
    'hands-on': ['project', 'interactive'],
  };
  if (goodMatches[style]?.includes(format)) return 1.0;
  return 0.4; // mismatch
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
    const isAssessmentCompletion = eventType === 'completed' && resource?.type === 'assessment' && score != null;
    let bktEvent: { correct: boolean } | null = null;
    if (eventType === 'completed') bktEvent = { correct: true };
    else if (eventType === 'too_hard' || eventType === 'struggling') bktEvent = { correct: false };

    if (isAssessmentCompletion && resource?.skillsTaught) {
      // Score normalization assumption:
      // If score > 5 (e.g. percentage 0-100), convert via score / 20 to 0-5 scale.
      // If score <= 5, use score directly as 0-5 scale.
      const normalizedScore = score > 5 ? score / 20 : score;
      const isCorrect = normalizedScore >= 2.5;

      const { bktUpdate, BKT_PARAMS } = await import('../../../lib/core/reconciliation');
      const skillsTaught = resource.skillsTaught as string[];

      for (const skillName of skillsTaught) {
        // Create SkillEvidence record for assessment
        await prisma.skillEvidence.create({
          data: {
            userId,
            skillName,
            source: 'assessment',
            score: normalizedScore,
            reliability: 0.6,
            recencyWeight: 1.0,
          },
        });

        const existingSkill = userSkills.find((s) => s.skillName.toLowerCase() === skillName.toLowerCase());

        const priorKnown = existingSkill ? existingSkill.finalEstimate / 5 : BKT_PARAMS.P_L0;
        const newPKnown = bktUpdate(priorKnown, isCorrect);
        const newFinalEstimate = newPKnown * 5; // Scale [0,1] back to 0-5

        if (existingSkill) {
          await prisma.learnerSkill.update({
            where: { id: existingSkill.id },
            data: {
              finalEstimate: newFinalEstimate,
              lastAssessed: new Date(),
            },
          });
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
    } else if (bktEvent && resource?.skillsTaught) {
      const { bktUpdate, BKT_PARAMS } = await import('../../../lib/core/reconciliation');
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

    const formatFit = computeFormatFit(profile?.learningStyle, resource?.format);

    const context: ImpactLearnerContext = {
      hasPrereqGap,
      recentDiagnosticNormalizedScore: rawDiagScore != null ? rawDiagScore / 5 : null,
      resourceDifficulty: resource?.difficulty ?? 3,
      learnerExperienceLevel: profile?.experienceLevel || 'Intermediate',
      formatMismatch: formatFit <= 0.4,
    };

    // 3. Evaluate impact with deterministic impactEvaluator
    const coreEvent: CoreProgressEvent = {
      eventType: eventType as ProgressEventType,
      resourceId,
      score: score ?? null,
    };
    const impact = evaluateImpact(coreEvent, context);

    const isTooHard = eventType === 'too_hard';
    const isTooEasy = eventType === 'too_easy';
    const isSkipped = eventType === 'skipped';
    const shouldReplan = isTooHard || isTooEasy || isSkipped || impact.replan;

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
    let replacementResource: Awaited<ReturnType<typeof findHarderAlternative>>['replacementResource'] = null;
    let weakestSkill: string | null = null;
    let targetSkill: string | null = null;

    if (isTooHard) {
      const searchResult = await findRemedialPrerequisiteResource(
        resource,
        userSkills,
        existingResourceIds,
        scoringLearnerCtx
      );
      insertedResource = searchResult.insertedResource;
      weakestSkill = searchResult.weakestSkill;
    } else if (isTooEasy) {
      const searchResult = await findHarderAlternative(
        resource,
        userSkills,
        existingResourceIds,
        scoringLearnerCtx
      );
      replacementResource = searchResult.replacementResource;
      targetSkill = searchResult.targetSkill;
    } else if (isSkipped) {
      const searchResult = await findDifferentFormatAlternative(
        resource,
        userSkills,
        existingResourceIds,
        scoringLearnerCtx
      );
      replacementResource = searchResult.replacementResource;
      targetSkill = searchResult.targetSkill;
    }

    // 5. Convert items into candidates for prerequisiteSort
    let candidates: RankedResource[] = (currentPath?.items || []).map((item) => ({
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
    } else if (replacementResource) {
      candidates = candidates.map((cand) => {
        if (cand.resourceId === resourceId) {
          return {
            resourceId: replacementResource!.id,
            score: 0.9,
            scoreBreakdown: {
              skill_gap_match: 1.0,
              prerequisite_fit: 1.0,
              difficulty_fit: 1.0,
              time_fit: 1.0,
              learning_style_fit: 1.0,
            },
            skillsTaught: (replacementResource!.skillsTaught as string[]) || [],
            prerequisiteSkills: (replacementResource!.prerequisiteSkills as string[]) || [],
            durationHours: replacementResource!.durationHours ?? 5,
            difficulty: replacementResource!.difficulty ?? 3,
          };
        }
        return cand;
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
    } else if (replacementResource && isTooEasy) {
      adaptationReason = `Adapted path: Replaced "${resource?.title || resourceId}" with advanced resource "${replacementResource.title}" to match your accelerated pace.`;
      try {
        const prompt = `Explain why the learner's path is being adapted.
Event: Marked as too easy on resource "${resource?.title || resourceId}".
Action taken: Replaced with advanced resource "${replacementResource.title}" teaching ${targetSkill || 'advanced skills'}.
Write 1 encouraging, concise 1-2 sentence adaptation banner.`;
        const aiBanner = await callAI('writing', prompt, AdaptationBannerSchema);
        if (!Array.isArray(aiBanner) && aiBanner?.data?.banner) {
          adaptationReason = aiBanner.data.banner;
        }
      } catch {
        console.warn('[progress] Fallback adaptation banner used.');
      }
    } else if (replacementResource && isSkipped) {
      adaptationReason = `Adapted path: Replaced skipped resource "${resource?.title || resourceId}" with alternative resource "${replacementResource.title}" in a different format.`;
      try {
        const prompt = `Explain why the learner's path is being adapted.
Event: Skipped resource "${resource?.title || resourceId}".
Action taken: Replaced with alternative format resource "${replacementResource.title}" teaching ${targetSkill || 'key skills'}.
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
    } else if (isTooEasy) {
      adaptationReason = `No advanced alternative found; updated sequence for "${resource?.title || resourceId}".`;
    } else if (isSkipped) {
      adaptationReason = `No alternative format resource found; updated sequence after skipping "${resource?.title || resourceId}".`;
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

    // 6.5. Grounding check validation
    const rawResourceIds = sortedPath.items.map((item) => item.resourceId);
    const validGroundedIds = await groundingCheck(rawResourceIds);
    const validGroundedSet = new Set(validGroundedIds);

    const groundedItems = sortedPath.items.filter((item) => validGroundedSet.has(item.resourceId));

    if (rawResourceIds.length > groundedItems.length) {
      console.warn(
        `[Progress API] Grounding check removed ${rawResourceIds.length - groundedItems.length} ungrounded resource IDs.`
      );
    }

    if (groundedItems.length === 0 && rawResourceIds.length > 0) {
      return NextResponse.json(
        { error: 'No grounded resources available for this recommendation' },
        { status: 500 }
      );
    }

    // 7. Persist new learning path in database
    const newPath = await prisma.learningPath.create({
      data: {
        userId,
        version: newVersion,
        triggerReason: eventType,
        estimatedWeeksToGoal: sortedPath.estimatedWeeksToGoal,
        items: {
          create: groundedItems.map((item) => {
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

            if (replacementResource && item.resourceId === replacementResource.id) {
              return {
                resourceId: item.resourceId,
                phase: PHASE_NUMBERS[item.phase] || 1,
                position: item.position,
                status: 'pending',
                reason: isTooEasy
                  ? `Advanced replacement: Upgraded to match higher level in ${targetSkill || 'skills'}.`
                  : `Format adaptation: Alternative format resource replacing skipped content.`,
                score: 0.9,
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
