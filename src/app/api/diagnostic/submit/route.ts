import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { diagnosticSubmitSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = diagnosticSubmitSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId, skillName, answers } = parsed.data;

    const diagnostic = await prisma.diagnostic.findUnique({
      where: { skillName }
    });

    if (!diagnostic) {
      return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
    }

    const dbQuestions = diagnostic.questions as any[];
    
    let correctCount = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const ans of answers) {
      const q = dbQuestions.find(q => q.id === ans.questionId);
      if (q) {
        maxPossibleScore += q.difficulty;
        if (q.correctAnswer === ans.selectedAnswer) {
          correctCount++;
          totalScore += q.difficulty;
        }
      }
    }

    // Scale to 0-5
    const observedLevel = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 5 : 0;
    const finalLevel = Number(Math.max(1, Math.min(5, observedLevel)).toFixed(1));

    // Get current self-report to check mismatch
    const currentSkill = await prisma.learnerSkill.findUnique({
      where: { userId_skillName: { userId, skillName } }
    });

    let mismatchDetected = false;
    if (currentSkill && Math.abs(currentSkill.selfRatedLevel - finalLevel) > 1.5) {
      mismatchDetected = true;
    }

    // Write Evidence
    await prisma.skillEvidence.create({
      data: {
        userId,
        skillName,
        source: 'diagnostic',
        score: finalLevel,
        reliability: 0.7, // diagnostics have higher reliability
        recencyWeight: 1.0,
      }
    });

    // Update LearnerSkill (reconciliation happens explicitly later, but we store observed here)
    if (currentSkill) {
      await prisma.learnerSkill.update({
        where: { userId_skillName: { userId, skillName } },
        data: { observedLevel: finalLevel }
      });
    }

    return NextResponse.json({
      observedLevel: finalLevel,
      mismatchDetected,
    });

  } catch (error: any) {
    console.error('[API Diagnostic Submit]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
