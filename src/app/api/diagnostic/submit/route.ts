import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconcileSkillEstimate, SkillEvidence } from '@/lib/core/reconciliation';

export async function POST(request: Request) {
  try {
    const { userId, skillName, score } = await request.json(); // score 0-5
    if (!userId || !skillName || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // 1. Create Evidence
    await prisma.skillEvidence.create({
      data: {
        userId,
        skillName,
        source: 'diagnostic',
        score,
        reliability: 0.7, // Diagnostic has high reliability
        recencyWeight: 1.0,
      }
    });

    // 2. Fetch all evidence and reconcile
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

    // 3. Update LearnerSkill
    const updatedSkill = await prisma.learnerSkill.update({
      where: { userId_skillName: { userId, skillName } },
      data: {
        finalEstimate: reconciled.final_estimate ?? score,
        confidenceScore: reconciled.confidence_score,
        observedLevel: Math.round(score),
        lastAssessed: new Date()
      }
    });

    return NextResponse.json({ success: true, updatedSkill });

  } catch (error: any) {
    console.error('Error submitting diagnostic:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
