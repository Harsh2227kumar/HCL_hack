import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recommendSchema } from '@/lib/validation/schemas';
import { calculateSkillGaps } from '@/lib/core/skillGap';
import { scoreResources } from '@/lib/core/hybridScoring';
import { groundingCheck } from '@/lib/validation/groundingCheck';
import { generateEmbedding } from '@/lib/ai/embeddings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = recommendSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId } = parsed.data;

    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      include: { goalTemplate: true }
    });

    if (!profile || !profile.goalTemplate) {
      return NextResponse.json({ error: 'Profile or GoalTemplate not found' }, { status: 404 });
    }

    const skills = await prisma.learnerSkill.findMany({
      where: { userId }
    });

    const { gaps, readinessScore } = calculateSkillGaps(skills as any, profile.goalTemplate as any);

    if (gaps.length === 0) {
      return NextResponse.json({ recommendations: [], readinessScore });
    }

    // With 20k+ resources, we rely on exact skill mapping rather than vector search 
    // to avoid rate limits and improve performance.
    const gapSkillsArray = gaps.map(g => g.skillName);
    const gapSkillsFormatted = gapSkillsArray.map(s => `'${s.replace(/'/g, "''")}'`).join(',');
    
    const rawResources = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, title, type, provider, description, url, "skillsTaught", "prerequisiteSkills", difficulty, "durationHours", format
      FROM "LearningResource"
      WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text("skillsTaught") as skill 
        WHERE skill IN (${gapSkillsFormatted})
      )
      LIMIT 100
    `);

    // We only need the resources themselves for scoring
    const candidates = rawResources.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      provider: r.provider,
      description: r.description,
      url: r.url,
      skillsTaught: r.skillsTaught,
      prerequisiteSkills: r.prerequisiteSkills,
      difficulty: r.difficulty,
      durationHours: r.durationHours,
      format: r.format,
    }));

    // Score candidates
    const scored = scoreResources(candidates as any, skills as any, gaps, profile as any);

    // Grounding check
    const resourceIds = scored.map(s => s.resourceId);
    const { valid, invalid } = await groundingCheck(resourceIds, prisma);

    if (invalid.length > 0) {
      console.warn(`[Recommend] Grounding check failed for: ${invalid.join(', ')}`);
    }

    const finalRecommendations = scored.filter(s => valid.includes(s.resourceId));

    return NextResponse.json({ 
      recommendations: finalRecommendations,
      readinessScore 
    });

  } catch (error: any) {
    console.error('[API Recommend]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
