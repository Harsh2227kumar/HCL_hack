import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSkillGaps } from '@/lib/core/skillGap';
import { generateReasoningTrace } from '@/lib/core/reasoningTrace';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const resourceId = searchParams.get('resourceId');

    if (!userId || !resourceId) {
      return NextResponse.json({ error: 'Missing userId or resourceId' }, { status: 400 });
    }

    // This route should really just return the trace generated during path generation.
    // Let's reconstruct it.
    const profile = await prisma.learnerProfile.findUnique({
      where: { userId },
      include: { goalTemplate: true }
    });

    const path = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
      include: { items: true }
    });

    if (!profile || !profile.goalTemplate || !path) {
      return NextResponse.json({ error: 'Profile or Path not found' }, { status: 404 });
    }

    const skills = await prisma.learnerSkill.findMany({ where: { userId } });
    const { gaps } = calculateSkillGaps(skills as any, profile.goalTemplate as any);

    // Reconstruct PathPhase array
    const phasesMap = new Map<number, any>();
    for (const item of path.items) {
      if (!phasesMap.has(item.phase)) {
        phasesMap.set(item.phase, { phase: item.phase, phaseName: item.phaseName, items: [] });
      }
      phasesMap.get(item.phase).items.push(item);
    }
    const phases = Array.from(phasesMap.values()).sort((a, b) => a.phase - b.phase);

    // Fetch resources
    const resourceIds = path.items.map(i => i.resourceId);
    const resources = await prisma.learningResource.findMany({
      where: { id: { in: resourceIds } }
    });
    const resourceMap = new Map(resources.map(r => [r.id, r]));

    const trace = generateReasoningTrace(gaps, phases, resourceMap as any);

    // If a specific resource is requested, return just that trace
    const specificTrace = trace.find(t => t.resourceSelected === resourceMap.get(resourceId)?.title);

    if (specificTrace) {
      return NextResponse.json({ trace: [specificTrace] });
    }

    // Otherwise return full trace
    return NextResponse.json({ trace });

  } catch (error: any) {
    console.error('[API Explain Trace]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
