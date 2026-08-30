import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { progressSchema } from '@/lib/validation/schemas';
import { evaluateImpact } from '@/lib/core/impactEvaluator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = progressSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId, resourceId, eventType, score } = parsed.data;

    // 1. Record Progress Event
    await prisma.progressEvent.create({
      data: {
        userId,
        resourceId,
        eventType,
        score,
      }
    });

    // 2. Update Path Item Status
    const latestPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
      include: { items: true }
    });

    if (latestPath) {
      const item = latestPath.items.find(i => i.resourceId === resourceId);
      if (item) {
        await prisma.learningPathItem.update({
          where: { id: item.id },
          data: { status: eventType as any }
        });
      }
    }

    // 3. Evaluate Impact (Adaptive Replanning)
    if (latestPath) {
      const learnerSkills = await prisma.learnerSkill.findMany({ where: { userId } });
      const resources = await prisma.learningResource.findMany();
      
      const { shouldReplan, cause, action } = evaluateImpact(
        { resourceId, eventType } as any,
        learnerSkills as any,
        latestPath as any,
        resources as any
      );

      if (shouldReplan) {
        // Trigger replan (by calling path generate internally or just flagging it)
        // For now, we return the flag so the client can trigger the replan.
        return NextResponse.json({
          adapted: true,
          cause,
          action,
          message: 'Path adaptation triggered based on progress update.'
        });
      }
    }

    return NextResponse.json({ adapted: false });

  } catch (error: any) {
    console.error('[API Progress]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
