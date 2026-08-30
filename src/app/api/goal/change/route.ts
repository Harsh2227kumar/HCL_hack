import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { goalChangeSchema } from '@/lib/validation/schemas';
import { calculateSkillGaps } from '@/lib/core/skillGap';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = goalChangeSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId, newGoal, newGoalTemplateId } = parsed.data;

    let templateId = newGoalTemplateId;
    if (!templateId) {
      const t = await prisma.goalTemplate.findFirst({
        where: { goalName: { equals: newGoal, mode: 'insensitive' } }
      });
      templateId = t?.id;
    }

    // 1. Update Goal
    await prisma.learnerProfile.update({
      where: { userId },
      data: {
        goal: newGoal,
        goalTemplateId: templateId,
      }
    });

    if (!templateId) {
      return NextResponse.json({ message: 'Goal updated but no template found. Path cannot be generated.' });
    }

    // 2. Recalculate Gaps
    const template = await prisma.goalTemplate.findUnique({ where: { id: templateId } });
    const skills = await prisma.learnerSkill.findMany({ where: { userId } });
    
    const { gaps, readinessScore, matchedSkills, missingSkills } = calculateSkillGaps(skills as any, template as any);

    return NextResponse.json({ 
      newGoal, 
      transferredSkills: matchedSkills,
      newGaps: gaps,
      readinessScore,
      missingSkills,
      message: 'Goal updated successfully. Client should call /api/path/generate next.'
    });

  } catch (error: any) {
    console.error('[API Goal Change]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
