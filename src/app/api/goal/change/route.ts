import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { getQueryEmbedding } from '../../../../lib/ai/embeddings';
import { scoreResource, LearnerContext as ScoringLearnerContext } from '../../../../lib/core/hybridScoring';
import { prerequisiteSort, RankedResource } from '../../../../lib/core/prerequisiteSort';
import learningResourcesData from '../../../../../data/learning_resources.json';

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

    // 2. Fetch existing user skills & calculate gap analysis
    const existingSkills = await prisma.learnerSkill.findMany({
      where: { userId },
    });

    const transferableSkills: string[] = [];
    const newGaps: Array<{ skill: string; currentLevel: number; targetLevel: number }> = [];

    requiredSkills.forEach((req) => {
      const userSkill = existingSkills.find((s) => s.skillName.toLowerCase() === req.skill.toLowerCase());
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

    // 3. Upsert LearnerSkill rows for each required skill in the new goal
    for (const req of requiredSkills) {
      await prisma.learnerSkill.upsert({
        where: {
          userId_skillName: {
            userId,
            skillName: req.skill,
          },
        },
        update: {
          targetLevel: req.min_level,
        },
        create: {
          userId,
          skillName: req.skill,
          selfRatedLevel: 0,
          finalEstimate: 0,
          confidenceScore: 0,
          targetLevel: req.min_level,
          lastAssessed: new Date(),
        },
      });
    }

    // 4. Update profile goal
    const dbProfile = await prisma.learnerProfile.upsert({
      where: { userId },
      update: { goal: newGoalName },
      create: { userId, goal: newGoalName },
    });

    // 5. Fetch ALL user's current LearnerSkill rows fresh from DB
    const dbSkills = await prisma.learnerSkill.findMany({
      where: { userId },
      select: {
        skillName: true,
        finalEstimate: true,
        targetLevel: true,
        confidenceScore: true,
      },
    });

    // 6. Fetch previous latest LearningPath to preserve completed work
    const previousPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
      include: { items: true },
    });

    const nextVersion = (previousPath?.version ?? 0) + 1;
    const previousCompletedResourceIds = new Set(
      (previousPath?.items || [])
        .filter((i) => i.status === 'completed')
        .map((i) => i.resourceId)
    );

    const progressEvents = await prisma.progressEvent.findMany({
      where: { userId },
      select: { resourceId: true, eventType: true },
    });

    const learnerContext: ScoringLearnerContext = {
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

    // 7. Candidate resource retrieval (semantic pgvector -> DB findMany -> JSON fallback)
    let queryEmbedding: number[] = [];
    let embeddingAvailable = false;
    try {
      queryEmbedding = await getQueryEmbedding(newGoalName);
      embeddingAvailable = true;
    } catch {
      console.warn('[Goal Change API] Embedding unavailable — using fallback retrieval.');
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
        `, vectorString, 50);
      } catch {
        console.warn('[Goal Change API] pgvector database query fallback — proceeding without semantic ranking.');
      }
    }

    if (!candidates || candidates.length === 0) {
      try {
        const dbResources = await prisma.learningResource.findMany({ take: 50 });
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
        console.warn('[Goal Change API] DB fallback findMany error:', findErr);
      }
    }

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
      candidates = fallbackList.slice(0, 50).map((r) => ({
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

    // 8. Hybrid scoring
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

    // 9. Topological prerequisite sort
    const sortedPath = prerequisiteSort(candidatesToSort, learnerContext.weeklyHours);
    const estimatedWeeksToGoal = sortedPath.estimatedWeeksToGoal;

    // 10. Persist new LearningPath & items in Prisma with completed status preserved
    const phaseToNumber: Record<string, number> = {
      Foundations: 1,
      Core: 2,
      'Applied Project': 3,
      Specialization: 4,
      Capstone: 5,
    };

    const candidateLookup = new Map(candidates.map((c) => [c.id, c]));
    const scoreLookup = new Map(scoredCandidates.map((c) => [c.resourceId, c]));

    const newPath = await prisma.learningPath.create({
      data: {
        userId,
        version: nextVersion,
        triggerReason: 'goal_change',
        estimatedWeeksToGoal,
        items: {
          create: sortedPath.items.map((item) => {
            const scored = scoreLookup.get(item.resourceId);
            const isCompleted = previousCompletedResourceIds.has(item.resourceId);

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
              resourceId: item.resourceId,
              phase: phaseToNumber[item.phase] || 1,
              position: item.position,
              status: isCompleted ? 'completed' : 'pending',
              reason,
              score: scored?.score ?? 0.8,
              scoreBreakdown: (scored?.scoreBreakdown as Prisma.InputJsonValue) ?? {},
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
