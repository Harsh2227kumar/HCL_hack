import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconcileSchema } from '@/lib/validation/schemas';
import { reconcileSkill } from '@/lib/core/reconciliation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reconcileSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId } = parsed.data;

    // Get all skills for this user
    const userSkills = await prisma.learnerSkill.findMany({
      where: { userId }
    });

    // Reconcile each skill
    const updatedSkills = [];

    for (const skill of userSkills) {
      const evidence = await prisma.skillEvidence.findMany({
        where: { userId, skillName: skill.skillName }
      });

      const { finalEstimate, confidenceScore } = reconcileSkill(evidence as any);

      const updated = await prisma.learnerSkill.update({
        where: { id: skill.id },
        data: {
          finalEstimate,
          confidenceScore,
        }
      });
      updatedSkills.push(updated);
    }

    return NextResponse.json({ skills: updatedSkills });

  } catch (error: any) {
    console.error('[API Skills Reconcile]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
