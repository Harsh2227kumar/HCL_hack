import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSkillGaps } from '@/lib/core/skillGap';
import { detectBottlenecks } from '@/lib/core/bottleneckDetection';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

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

    const dependencies = await prisma.skillDependency.findMany();

    const bottlenecks = detectBottlenecks(gaps, dependencies as any);

    return NextResponse.json({
      bottleneck: bottlenecks.length > 0 ? bottlenecks[0] : null,
      allBottlenecks: bottlenecks,
      readinessScore
    });

  } catch (error: any) {
    console.error('[API Skills Bottleneck]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
