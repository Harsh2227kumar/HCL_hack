import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pathGenerateSchema } from '@/lib/validation/schemas';
import { calculateSkillGaps } from '@/lib/core/skillGap';
import { scoreResources } from '@/lib/core/hybridScoring';
import { generatePath } from '@/lib/core/prerequisiteSort';
import { generateReasoningTrace } from '@/lib/core/reasoningTrace';
import { calculatePathwayMetrics } from '@/lib/core/onboardingMetrics';
import { generateEmbedding } from '@/lib/ai/embeddings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = pathGenerateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId } = parsed.data;

    // 1. Fetch State
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      include: { goalTemplate: true }
    });

    if (!profile || !profile.goalTemplate) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const skills = await prisma.learnerSkill.findMany({ where: { userId } });
    const { gaps, readinessScore } = calculateSkillGaps(skills as any, profile.goalTemplate as any);

    // 2. Retrieve & Score Candidates (Internal recommend logic)
    // With 20k+ resources, we rely on exact skill mapping rather than vector search 
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

    const candidates = rawResources.map(r => ({ ...r }));
    const resourceMap = new Map(candidates.map(c => [c.id, c]));

    const scored = scoreResources(candidates as any, skills as any, gaps, profile as any);

    // 3. Generate Path DAG
    const dependencies = await prisma.skillDependency.findMany();
    const { phases, estimatedWeeksToGoal } = generatePath(scored, dependencies as any, profile.weeklyHours || 5, resourceMap);

    // 4. Generate Reasoning Trace and Metrics (skillbridge-ai inspired)
    const trace = generateReasoningTrace(gaps, phases, resourceMap as any);
    const metrics = calculatePathwayMetrics(phases, readinessScore, profile.weeklyHours, resourceMap as any);

    // 5. Persist Path
    const lastPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' }
    });
    
    const nextVersion = lastPath ? lastPath.version + 1 : 1;

    const newPath = await prisma.learningPath.create({
      data: {
        userId,
        version: nextVersion,
        triggerReason: nextVersion === 1 ? 'initial' : 'manual_regeneration',
        estimatedWeeksToGoal,
        items: {
          create: phases.flatMap(phase => 
            phase.items.map(item => ({
              resourceId: item.resourceId,
              phase: phase.phase,
              phaseName: phase.phaseName,
              position: item.position,
              status: 'pending',
              reason: trace.find(t => t.resourceSelected === resourceMap.get(item.resourceId)?.title)?.reason || 'Recommended',
            }))
          )
        }
      },
      include: { items: true }
    });

    return NextResponse.json({ 
      path: newPath, 
      estimatedWeeksToGoal,
      metrics,
      trace 
    });

  } catch (error: any) {
    console.error('[API Path Generate]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
