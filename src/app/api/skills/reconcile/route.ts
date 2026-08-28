import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconcileSkillEstimate, SkillEvidence } from '@/lib/core/reconciliation';

export async function POST(request: Request) {
  try {
    const { userId, skillName } = await request.json();
    if (!userId || !skillName) return NextResponse.json({ error: 'Missing inputs' }, { status: 400 });

    const allEvidence = await prisma.skillEvidence.findMany({
      where: { userId, skillName }
    });

    const evidenceRecords: SkillEvidence[] = allEvidence.map(e => ({
      score: e.score,
      reliability: e.reliability,
      source: e.source,
      timestamp: e.timestamp
    }));

    const reconciled = reconcileSkillEstimate(evidenceRecords);

    const updatedSkill = await prisma.learnerSkill.update({
      where: { userId_skillName: { userId, skillName } },
      data: {
        finalEstimate: reconciled.final_estimate ?? 0,
        confidenceScore: reconciled.confidence_score,
      }
    });

    return NextResponse.json({ success: true, updatedSkill });

  } catch (error: any) {
    console.error('Error reconciling skill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
