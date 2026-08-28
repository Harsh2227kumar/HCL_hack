import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQueryEmbedding } from '@/lib/ai/embeddings';
import { scoreResource, LearnerContext } from '@/lib/core/hybridScoring';
import { prerequisiteSort } from '@/lib/core/prerequisiteSort';
import {
  detectBottleneck,
  SkillMastery,
  SkillDependency,
} from '@/lib/core/bottleneckDetection';
import skillDependenciesData from '../../../../data/skill_dependencies.json';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || body.goal;
    const userId = body.userId;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query or goal parameter in request body.' },
        { status: 400 }
      );
    }

    // ── 1. Resolve Learner Context ──────────────────────────────────────
    // Merge DB-backed data (like /api/dashboard did) with request body data.
    let learnerContext: LearnerContext = {
      skillEstimates: [],
      weeklyHours: 10,
      learningStyle: 'visual',
      pastFeedback: [],
    };

    // Learner profile + skills from DB (real data path)
    let dbSkills: { skillName: string; finalEstimate: number; targetLevel: number; confidenceScore: number }[] = [];
    let dbProfile: { goal: string | null; weeklyHours: number | null; learningStyle: string | null } | null = null;
    let recentEvents: any[] = [];

    if (userId) {
      dbProfile = await prisma.learnerProfile.findUnique({
        where: { userId },
        select: { goal: true, weeklyHours: true, learningStyle: true },
      });

      dbSkills = await prisma.learnerSkill.findMany({
        where: { userId },
        select: {
          skillName: true,
          finalEstimate: true,
          targetLevel: true,
          confidenceScore: true,
        },
      });

      const progressEvents = await prisma.progressEvent.findMany({
        where: { userId },
        select: { resourceId: true, eventType: true },
      });

      recentEvents = await prisma.progressEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { resource: { select: { title: true } } },
      });

      learnerContext = {
        skillEstimates: dbSkills.map((s) => ({
          skill_name: s.skillName,
          final_estimate: s.finalEstimate,
        })),
        weeklyHours: dbProfile?.weeklyHours ?? 10,
        learningStyle: dbProfile?.learningStyle ?? 'visual',
        pastFeedback: progressEvents.map((e) => ({
          resource_id: e.resourceId,
          event_type: e.eventType,
        })),
      };
    } else if (body.learnerContext) {
      learnerContext = {
        skillEstimates: body.learnerContext.skillEstimates || [],
        weeklyHours: body.learnerContext.weeklyHours ?? 10,
        learningStyle: body.learnerContext.learningStyle ?? 'visual',
        pastFeedback: body.learnerContext.pastFeedback || [],
      };
    }

    // ── 2. Generate embedding for query text ────────────────────────────
    let queryEmbedding: number[];
    try {
      queryEmbedding = await getQueryEmbedding(query);
    } catch (embedError: any) {
      console.error('[Recommend API] Embedding generation failed:', embedError.message);
      return NextResponse.json(
        { error: 'Failed to generate embedding for the search query.' },
        { status: 500 }
      );
    }

    // ── 3. pgvector semantic top-k (k=15) ───────────────────────────────
    let candidates: any[] = [];
    try {
      const vectorString = `[${queryEmbedding.join(',')}]`;
      candidates = await prisma.$queryRawUnsafe(`
        SELECT id, title, type, provider, description, url,
               "skillsTaught", "prerequisiteSkills", difficulty, "durationHours", format,
               1 - (embedding <=> $1::vector) AS similarity
        FROM "LearningResource"
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $2
      `, vectorString, 15);
    } catch (dbError: any) {
      console.warn('[Recommend API] pgvector database query failed:', dbError.message);
      return NextResponse.json({
        recommendations: [],
        reason: 'Database semantic search not available or learning resources have not been seeded.',
      });
    }

    // ── 4. Handle empty candidates ──────────────────────────────────────
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        recommendations: [],
        reason: 'No similar learning resources found matching the query.',
      });
    }

    // ── 5. Hybrid scoring ───────────────────────────────────────────────
    const scoredCandidates = candidates.map((candidate) => {
      const resourceData = {
        id: candidate.id,
        skills_taught: Array.isArray(candidate.skillsTaught) ? candidate.skillsTaught : [],
        prerequisite_skills: Array.isArray(candidate.prerequisiteSkills) ? candidate.prerequisiteSkills : [],
        difficulty: candidate.difficulty,
        duration_hours: candidate.durationHours,
        format: candidate.format,
      };

      const result = scoreResource(resourceData, learnerContext, candidate.similarity || 0.0);

      return {
        resourceId: candidate.id,
        score: result.score,
        scoreBreakdown: result.score_breakdown,
        skillsTaught: resourceData.skills_taught,
        prerequisiteSkills: resourceData.prerequisite_skills,
        durationHours: resourceData.duration_hours,
        difficulty: resourceData.difficulty,
        recommendation_status: result.recommendation_status,
      };
    });

    // ── 6. Kahn's topological sort ──────────────────────────────────────
    const weeklyHours = learnerContext.weeklyHours || 10;
    const { items, estimatedWeeksToGoal } = prerequisiteSort(scoredCandidates, weeklyHours);

    // ── 7. Map sorted items to milestone shape for the frontend ─────────
    const milestones = items.map((item) => {
      const candidateData = candidates.find((c: any) => c.id === item.resourceId);
      const scoreData = scoredCandidates.find((sc) => sc.resourceId === item.resourceId);
      return {
        id: item.resourceId,
        status: 'pending',
        phase: item.phase,
        resource: {
          title: candidateData?.title || 'Unknown Resource',
          durationHours: candidateData?.durationHours || 5,
          format: candidateData?.format || 'course',
        },
        reason: scoreData?.recommendation_status || 'Recommended based on your profile',
      };
    });

    // ── 8. Real skill gaps from DB (or from learnerContext) ─────────────
    let skillGaps: { skillName: string; current: number; target: number; gap: number; confidence: number }[] = [];

    if (dbSkills.length > 0) {
      // DB-backed path: use actual learner_skills rows
      skillGaps = dbSkills.map((s) => ({
        skillName: s.skillName,
        current: s.finalEstimate,
        target: s.targetLevel,
        gap: Math.max(0, s.targetLevel - s.finalEstimate),
        confidence: s.confidenceScore,
      }));
    } else if (learnerContext.skillEstimates.length > 0) {
      // Passed-in context path: derive from the estimates
      skillGaps = learnerContext.skillEstimates.map((s) => ({
        skillName: s.skill_name,
        current: s.final_estimate,
        target: 5, // default target when no DB row exists
        gap: Math.max(0, 5 - s.final_estimate),
        confidence: 0.5,
      }));
    }

    // ── 9. Real bottleneck detection ────────────────────────────────────
    // Convert skill data to SkillMastery format (P(known) in [0,1])
    const skillMasteries: SkillMastery[] = skillGaps.map((s) => ({
      skillName: s.skillName,
      // finalEstimate is on 0–5 scale in the DB; convert to P(known) [0,1]
      pKnown: s.current / 5,
    }));

    const dependencies: SkillDependency[] = (skillDependenciesData as any[]).map((d) => ({
      skill_name: d.skill_name,
      depends_on_skill_name: d.depends_on_skill_name,
    }));

    const bottleneckResult = detectBottleneck(skillMasteries, dependencies);
    const bottleneck = bottleneckResult.skill_name;

    // ── 9.5 Persist the generated path to the DB ─────────────────────────
    let savedPath = null;
    if (userId) {
      // Find the next version number
      const lastPath = await prisma.learningPath.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (lastPath?.version ?? 0) + 1;
      
      // Persist the path and its items
      savedPath = await prisma.learningPath.create({
        data: {
          userId,
          version: nextVersion,
          triggerReason: 'recommendation_engine',
          estimatedWeeksToGoal: estimatedWeeksToGoal,
          items: {
            create: items.map((item) => {
              const scoreData = scoredCandidates.find((sc) => sc.resourceId === item.resourceId);
              return {
                resourceId: item.resourceId,
                phase: item.phase === 'Foundations' ? 1 :
                       item.phase === 'Core' ? 2 :
                       item.phase === 'Applied Project' ? 3 :
                       item.phase === 'Specialization' ? 4 : 5,
                position: item.position,
                status: 'pending',
                reason: scoreData?.recommendation_status || 'Recommended based on your profile',
                score: scoreData?.score || 0,
                scoreBreakdown: (scoreData?.scoreBreakdown as any) || {},
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
                  id: true, title: true, type: true,
                  difficulty: true, durationHours: true, format: true,
                }
              }
            }
          }
        }
      });
    }

    // ── 10. Construct full dashboard-compatible payload ──────────────────
    // Map the items to match the exact frontend expectations in dashboard/page.tsx
    const phaseNames = ['Foundations', 'Core', 'Applied Project', 'Specialization', 'Capstone'];
    
    let displayMilestones = [];
    if (savedPath) {
      displayMilestones = savedPath.items.map(item => ({
        id: item.resourceId, // Frontend expects resourceId as the id
        status: item.status,
        phase: phaseNames[item.phase - 1] || 'Foundations', // Convert int back to string
        resource: {
          title: (item as any).resource?.title || 'Unknown Resource',
          durationHours: (item as any).resource?.durationHours || 5,
          format: (item as any).resource?.format || 'course',
        },
        reason: item.reason,
      }));
    } else {
      displayMilestones = milestones;
    }

    const nextBestAction = displayMilestones.length > 0 ? displayMilestones[0] : null;

    const aiInsight = bottleneck
      ? `Based on your goal to master ${query}, resolving your bottleneck in ${bottleneck} should be your immediate priority. It blocks ${bottleneckResult.downstream_count} downstream skill${bottleneckResult.downstream_count !== 1 ? 's' : ''}.`
      : `Based on your goal to master ${query}, you're making good progress across all tracked skills. Continue with the recommended path.`;

    return NextResponse.json({
      goal: dbProfile?.goal || query,
      weeklyHours: weeklyHours,
      timeToGoalWeeks: estimatedWeeksToGoal,
      bottleneck: bottleneck,
      skillGaps: skillGaps,
      activePath: savedPath ? {
        id: savedPath.id,
        version: savedPath.version,
        triggerReason: savedPath.triggerReason,
        generatedAt: savedPath.generatedAt,
        milestones: displayMilestones,
      } : {
        milestones: displayMilestones,
      },
      nextBestAction: nextBestAction,
      recentActivity: recentEvents,
      aiInsight: aiInsight,
    });

  } catch (error: any) {
    console.error('[Recommend API] Unhandled Error:', error.message);
    return NextResponse.json(
      { error: 'An internal error occurred during recommendation processing.' },
      { status: 500 }
    );
  }
}
