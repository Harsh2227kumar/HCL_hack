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
import learningResourcesData from '../../../../data/learning_resources.json';
import { groundingCheck } from '../../../lib/validation/groundingCheck';

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
    let learnerContext: LearnerContext = {
      skillEstimates: [],
      weeklyHours: 10,
      learningStyle: 'visual',
      pastFeedback: [],
    };

    let dbSkills: { skillName: string; finalEstimate: number; targetLevel: number; confidenceScore: number }[] = [];
    let dbProfile: { goal: string | null; weeklyHours: number | null; learningStyle: string | null } | null = null;
    let recentEvents: Array<{ id: string; userId: string; resourceId: string; eventType: string; score: number | null; createdAt: Date; resource?: { title: string } }> = [];

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
          target_level: s.targetLevel,
          confidence_score: s.confidenceScore,
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
    let queryEmbedding: number[] = [];
    let embeddingAvailable = false;
    try {
      queryEmbedding = await getQueryEmbedding(query);
      embeddingAvailable = true;
    } catch {
      console.warn('[Recommend API] Embedding unavailable — using keyword/skill matching fallback.');
    }

    // ── 3. pgvector semantic top-k (k=15) ───────────────────────────────
    interface CandidateResource {
      id: string;
      title: string;
      type: string;
      provider: string;
      description: string;
      url: string;
      skillsTaught: string[];
      prerequisiteSkills: string[];
      difficulty: number;
      durationHours: number;
      format: string;
      similarity: number;
    }

    let candidates: CandidateResource[] = [];
    if (embeddingAvailable) {
      try {
        const vectorString = `[${queryEmbedding.join(',')}]`;
        candidates = await prisma.$queryRawUnsafe<CandidateResource[]>(`
          SELECT id, title, type, provider, description, url,
                 "skillsTaught", "prerequisiteSkills", difficulty, "durationHours", format,
                 1 - (embedding <=> $1::vector) AS similarity
          FROM "LearningResource"
          ORDER BY embedding <=> $1::vector ASC
          LIMIT $2
        `, vectorString, 15);
      } catch {
        console.warn('[Recommend API] pgvector database query fallback — proceeding without semantic ranking.');
      }
    }

    // Fallback tier 1: Standard DB lookup if pgvector has no vector embeddings
    if (!candidates || candidates.length === 0) {
      try {
        const dbResources = await prisma.learningResource.findMany({ take: 25 });
        if (dbResources.length > 0) {
          candidates = dbResources.map((r) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            provider: r.provider || 'Curated',
            description: r.description || '',
            url: r.url || '',
            skillsTaught: (r.skillsTaught as string[]) || [],
            prerequisiteSkills: (r.prerequisiteSkills as string[]) || [],
            difficulty: r.difficulty,
            durationHours: r.durationHours || 5,
            format: r.format || 'course',
            similarity: 0.8,
          }));
        }
      } catch (findErr) {
        console.warn('[Recommend API] DB fallback findMany error:', findErr);
      }
    }

    // Fallback tier 2: Direct dataset JSON fallback for unseeded fresh environments
    if (!candidates || candidates.length === 0) {
      const fallbackList = learningResourcesData as Array<{
        id: string;
        title: string;
        type: string;
        provider?: string;
        description?: string;
        url?: string;
        skills_taught?: string[];
        prerequisite_skills?: string[];
        difficulty?: number | string;
        duration_hours?: number;
        format?: string;
      }>;
      candidates = fallbackList.slice(0, 20).map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        provider: r.provider || 'Curated',
        description: r.description || '',
        url: r.url || '',
        skillsTaught: r.skills_taught || [],
        prerequisiteSkills: r.prerequisite_skills || [],
        difficulty: typeof r.difficulty === 'number' ? r.difficulty : 3,
        durationHours: r.duration_hours || 5,
        format: r.format || 'course',
        similarity: 0.75,
      }));
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
        durationHours: candidate.durationHours,
        difficulty: typeof candidate.difficulty === 'number' ? candidate.difficulty : 3,
        recommendation_status: result.recommendation_status,
      };
    });

    const recommendedOnly = scoredCandidates.filter((c) => c.recommendation_status === 'recommended');
    const candidatesToSort = recommendedOnly.length >= 3 ? recommendedOnly : scoredCandidates;

    // ── 6. Topological Prerequisite Sort & 5-Phase Bucketing ────────────
    const weeklyHours = learnerContext.weeklyHours;
    const sortedPath = prerequisiteSort(candidatesToSort, weeklyHours);
    const estimatedWeeksToGoal = sortedPath.estimatedWeeksToGoal;

    // ── 7. Bottleneck Detection via Graph Traversal & BKT ───────────────
    const skillMasteries: SkillMastery[] = dbSkills.map((s) => ({
      skillName: s.skillName,
      pKnown: s.finalEstimate / 5,
    }));

    const dependencies: SkillDependency[] = (skillDependenciesData as Array<{ skill_name: string; depends_on_skill_name: string }>).map((d) => ({
      skill_name: d.skill_name,
      depends_on_skill_name: d.depends_on_skill_name,
    }));

    const bottleneckResult = detectBottleneck(skillMasteries, dependencies);
    const bottleneck = bottleneckResult.skill_name;

    // ── 8. Assemble Milestones Response ─────────────────────────────────
    const candidateLookup = new Map(candidates.map((c) => [c.id, c]));
    const scoreLookup = new Map(scoredCandidates.map((c) => [c.resourceId, c]));

    const milestones = sortedPath.items.map((item) => {
      const resource = candidateLookup.get(item.resourceId);
      const scored = scoreLookup.get(item.resourceId);

      const reasons: string[] = [];
      if (scored) {
        if (scored.scoreBreakdown.skill_gap_match > 0.6) reasons.push('targets high-priority skill gaps');
        if (scored.scoreBreakdown.prerequisite_fit >= 1.0) reasons.push('prerequisites fully satisfied');
        if (scored.scoreBreakdown.difficulty_fit > 0.7) reasons.push('matches current experience level');
        if (scored.scoreBreakdown.time_fit >= 1.0) reasons.push('fits weekly study schedule');
      }

      const reason = reasons.length > 0
        ? `Recommended because it ${reasons.join(', ')}.`
        : 'Recommended based on overall track fit.';

      return {
        id: item.resourceId,
        phase: item.phase,
        position: item.position,
        resource: {
          title: resource?.title || 'Unknown Resource',
          durationHours: resource?.durationHours || 5,
          format: resource?.format || 'course',
          skillsTaught: (resource?.skillsTaught as string[]) || [],
          prerequisiteSkills: (resource?.prerequisiteSkills as string[]) || [],
        },
        reason,
        score: scored?.score ?? 0.8,
        scoreBreakdown: scored?.scoreBreakdown ?? {},
        recommendation_status: scored?.recommendation_status ?? 'recommended',
      };
    });

    // ── 8.5 Grounding check validation ───────────────────────────────────
    const rawResourceIds = milestones.map((m) => m.id);
    const validGroundedIds = await groundingCheck(rawResourceIds);
    const validGroundedSet = new Set(validGroundedIds);

    const groundedMilestones = milestones.filter((m) => validGroundedSet.has(m.id));

    if (rawResourceIds.length > groundedMilestones.length) {
      console.warn(
        `[Recommend API] Grounding check removed ${rawResourceIds.length - groundedMilestones.length} ungrounded resource IDs.`
      );
    }

    if (groundedMilestones.length === 0 && rawResourceIds.length > 0) {
      return NextResponse.json(
        { error: 'No grounded resources available for this recommendation' },
        { status: 500 }
      );
    }

    // ── 9. If userId provided, persist LearningPath & items in Prisma ────
    let savedPath = null;
    if (userId) {
      const latestPath = await prisma.learningPath.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
      });
      const nextVersion = (latestPath?.version || 0) + 1;

      const phaseToNumber: Record<string, number> = {
        Foundations: 1,
        Core: 2,
        'Applied Project': 3,
        Specialization: 4,
        Capstone: 5,
      };

      savedPath = await prisma.learningPath.create({
        data: {
          userId,
          version: nextVersion,
          triggerReason: 'recommendation_api',
          estimatedWeeksToGoal,
          items: {
            create: groundedMilestones.map((m) => ({
              resourceId: m.id,
              phase: phaseToNumber[m.phase] || 1,
              position: m.position,
              status: 'pending',
              reason: m.reason,
              score: m.score,
              scoreBreakdown: m.scoreBreakdown,
            })),
          },
        },
        include: {
          items: {
            orderBy: [{ phase: 'asc' }, { position: 'asc' }],
            include: {
              resource: {
                select: {
                  id: true, title: true, type: true,
                  difficulty: true, durationHours: true, format: true,
                  skillsTaught: true, prerequisiteSkills: true,
                }
              }
            }
          }
        }
      });
    }

    // ── 10. Construct full dashboard-compatible payload ──────────────────
    const phaseNames = ['Foundations', 'Core', 'Applied Project', 'Specialization', 'Capstone'];
    
    let displayMilestones = [];
    if (savedPath) {
      displayMilestones = savedPath.items.map(item => ({
        id: item.resourceId,
        status: item.status,
        phase: phaseNames[item.phase - 1] || 'Foundations',
        resource: {
          title: item.resource?.title || 'Unknown Resource',
          durationHours: item.resource?.durationHours || 5,
          format: item.resource?.format || 'course',
          skillsTaught: (item.resource?.skillsTaught as string[]) || [],
          prerequisiteSkills: (item.resource?.prerequisiteSkills as string[]) || [],
        },
        reason: item.reason,
        score: item.score,
        scoreBreakdown: item.scoreBreakdown || {},
        recommendation_status: item.reason,
      }));
    } else {
      displayMilestones = milestones;
    }

    const nextBestAction = displayMilestones.length > 0 ? displayMilestones[0] : null;

    const aiInsight = bottleneck
      ? `Based on your goal to master ${query}, resolving your bottleneck in ${bottleneck} should be your immediate priority. It blocks ${bottleneckResult.downstream_count} downstream skill${bottleneckResult.downstream_count !== 1 ? 's' : ''}.`
      : `Based on your goal to master ${query}, you're making good progress across all tracked skills. Continue with the recommended path.`;

    const skillGaps = dbSkills.map((skill) => ({
      skillName: skill.skillName,
      current: skill.finalEstimate,
      target: skill.targetLevel,
      gap: Math.max(0, skill.targetLevel - skill.finalEstimate),
      confidence: skill.confidenceScore,
    }));

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

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Recommend API] Unhandled Error:', errMsg);
    return NextResponse.json(
      { error: 'An internal error occurred during recommendation processing.' },
      { status: 500 }
    );
  }
}
