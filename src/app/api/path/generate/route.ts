import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { prerequisiteSort, RankedResource } from '@/lib/core/prerequisiteSort';
import { callAI } from '@/lib/ai/callAI';

const PHASE_NUMBERS: Record<string, number> = {
  'Foundations': 1,
  'Core': 2,
  'Applied Project': 3,
  'Specialization': 4,
  'Capstone': 5,
};

const ReasonSchema = z.object({
  reason: z.string().default('Recommended based on your current skill gaps and prerequisite order.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, candidates = [], weeklyHours = 10 } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 1. Run deterministic topological sort
    const sortedPath = prerequisiteSort(candidates as RankedResource[], weeklyHours);

    // Map candidate details for lookups
    const candidateMap = new Map<string, RankedResource>();
    (candidates as RankedResource[]).forEach((c) => candidateMap.set(c.resourceId, c));

    // 2. Generate explanation reasons via callAI writing role
    const itemsWithReasons = await Promise.all(
      sortedPath.items.map(async (item) => {
        const candidate = candidateMap.get(item.resourceId);
        const prompt = `Explain why resource "${item.resourceId}" is placed in phase "${item.phase}" at position ${item.position}.
Score breakdown: ${JSON.stringify(candidate?.scoreBreakdown || {})}
Skills taught: ${JSON.stringify(candidate?.skillsTaught || [])}`;

        let reason = `Recommended for ${item.phase} phase based on prerequisite ordering and skill score.`;
        try {
          const aiResponse = await callAI('writing', prompt, ReasonSchema);
          if (aiResponse?.reason) {
            reason = aiResponse.reason;
          }
        } catch (e) {
          console.warn(`[path/generate] Fallback reason used for ${item.resourceId}`);
        }

        return {
          resourceId: item.resourceId,
          phase: PHASE_NUMBERS[item.phase] || 1,
          position: item.position,
          status: 'pending',
          reason,
          score: candidate?.score ?? 0,
          scoreBreakdown: (candidate?.scoreBreakdown as any) ?? {},
        };
      })
    );

    // 3. Determine next path version for user
    const lastPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastPath?.version ?? 0) + 1;

    // 4. Persist LearningPath and LearningPathItem records in Prisma
    const newPath = await prisma.learningPath.create({
      data: {
        userId,
        version: nextVersion,
        triggerReason: 'initial',
        estimatedWeeksToGoal: sortedPath.estimatedWeeksToGoal,
        items: {
          create: itemsWithReasons,
        },
      },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      path: newPath,
    });
  } catch (error) {
    console.error('Error in /api/path/generate:', error);
    return NextResponse.json(
      { error: 'Failed to generate learning path' },
      { status: 500 }
    );
  }
}
