import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconcileSkillEstimate, SkillEvidence } from '@/lib/core/reconciliation';

export async function POST(request: Request) {
  try {
    const { userId, skillName, score } = await request.json(); // score 0-5
    if (!userId || !skillName || typeof score !== 'number' || score < 0 || score > 5) {
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
      reliability: e.reliability ?? undefined,
      source: e.source,
      timestamp: e.timestamp
    }));

    const reconciled = reconcileSkillEstimate(evidenceRecords);

    // 3. Upsert LearnerSkill
    const finalEstimate = reconciled.final_estimate ?? score;
    const confidenceScore = reconciled.confidence_score;
    const roundedScore = Math.round(score);

    const updatedSkill = await prisma.learnerSkill.upsert({
      where: { userId_skillName: { userId, skillName } },
      update: {
        finalEstimate,
        confidenceScore,
        observedLevel: roundedScore,
        lastAssessed: new Date()
      },
      create: {
        userId,
        skillName,
        selfRatedLevel: roundedScore,
        observedLevel: roundedScore,
        confidenceScore,
        finalEstimate,
        targetLevel: 5,
        lastAssessed: new Date()
      }
    });

    return NextResponse.json({ success: true, updatedSkill });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error submitting diagnostic:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
