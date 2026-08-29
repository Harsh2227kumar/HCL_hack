import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconcileSkillEstimate, SkillEvidence } from '@/lib/core/reconciliation';

interface AnswerInput {
  questionId: string;
  skillName: string;
  correct: boolean;
  difficulty: number;
}

export async function POST(request: Request) {
  try {
    const { userId, answers } = await request.json();
    if (!userId || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // 1. Create Evidence for each answer
    for (const answer of answers as AnswerInput[]) {
      if (!answer.skillName || typeof answer.correct !== 'boolean') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
      }
      await prisma.skillEvidence.create({
        data: {
          userId,
          skillName: answer.skillName,
          source: 'diagnostic',
          score: answer.correct ? 5 : 0,
          reliability: 0.7,
          recencyWeight: 1.0,
          timestamp: new Date(),
        }
      });
    }

    // 2. Group answers by skillName
    const uniqueSkillNames = Array.from(
      new Set((answers as AnswerInput[]).map(a => a.skillName))
    );

    const skillResults: Array<{
      skillName: string;
      finalEstimate: number;
      confidenceScore: number;
    }> = [];

    // 3 & 4. Reconcile evidence and upsert LearnerSkill per skill
    for (const skillName of uniqueSkillNames) {
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

      const finalEstimate = reconciled.final_estimate ?? 0;
      const confidenceScore = reconciled.confidence_score;
      const roundedScore = Math.round(finalEstimate);

      await prisma.learnerSkill.upsert({
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

      skillResults.push({
        skillName,
        finalEstimate,
        confidenceScore
      });
    }

    // 5. Return response summarizing per-skill results
    return NextResponse.json({ success: true, skillResults });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error submitting diagnostic:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

