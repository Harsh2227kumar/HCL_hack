import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQueryEmbedding } from '@/lib/ai/embeddings';
import { scoreResource, LearnerContext } from '@/lib/core/hybridScoring';

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

    // 1. Resolve Learner Context (either from database via userId, or passed in body, or default fallback)
    let learnerContext: LearnerContext = {
      skillEstimates: [],
      weeklyHours: 10,
      learningStyle: 'visual',
      pastFeedback: [],
    };

    if (userId) {
      // Load from database if userId is specified
      const profile = await prisma.learnerProfile.findUnique({
        where: { userId },
      });

      const skills = await prisma.learnerSkill.findMany({
        where: { userId },
        select: {
          skillName: true,
          finalEstimate: true,
        },
      });

      const progressEvents = await prisma.progressEvent.findMany({
        where: { userId },
        select: {
          resourceId: true,
          eventType: true,
        },
      });

      learnerContext = {
        skillEstimates: skills.map((s) => ({
          skill_name: s.skillName,
          final_estimate: s.finalEstimate,
        })),
        weeklyHours: profile?.weeklyHours ?? 10,
        learningStyle: profile?.learningStyle ?? 'visual',
        pastFeedback: progressEvents.map((e) => ({
          resource_id: e.resourceId,
          event_type: e.eventType,
        })),
      };
    } else if (body.learnerContext) {
      // Support passing learnerContext directly for testing
      learnerContext = {
        skillEstimates: body.learnerContext.skillEstimates || [],
        weeklyHours: body.learnerContext.weeklyHours ?? 10,
        learningStyle: body.learnerContext.learningStyle ?? 'visual',
        pastFeedback: body.learnerContext.pastFeedback || [],
      };
    }

    // 2. Generate embedding for query text via Gemini text-embedding-004
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

    // 3. Query pgvector semantic top-k (k=15) similar resources from DB
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
      // Empty-candidate-list case: return empty array with reason
      return NextResponse.json({
        recommendations: [],
        reason: 'Database semantic search not available or learning resources have not been seeded.',
      });
    }

    // 4. Handle empty candidate case
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        recommendations: [],
        reason: 'No similar learning resources found matching the query.',
      });
    }

    // 5. Run hybrid scoring on all candidates
    const scoredCandidates = candidates.map((candidate) => {
      // Map candidate database fields to the scorer parameter structure
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
        resource_id: candidate.id,
        score: result.score,
        score_breakdown: result.score_breakdown,
        recommendation_status: result.recommendation_status,
      };
    });

    // 6. Sort results descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      recommendations: scoredCandidates,
    });

  } catch (error: any) {
    console.error('[Recommend API] Unhandled Error:', error.message);
    return NextResponse.json(
      { error: 'An internal error occurred during recommendation processing.' },
      { status: 500 }
    );
  }
}
