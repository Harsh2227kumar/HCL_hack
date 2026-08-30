import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { diagnosticGenerateSchema, aiDiagnosticQuizSchema } from '@/lib/validation/schemas';
import { callAI } from '@/lib/ai/callAI';

const DIAGNOSTIC_SYSTEM_PROMPT = `Generate a 5-question multiple choice diagnostic quiz to test a user's proficiency in the requested skill.
The questions should range in difficulty from 1 (beginner) to 5 (expert).
Return ONLY valid JSON matching the exact schema.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = diagnosticGenerateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId, skillName } = parsed.data;

    // First check if we already have a diagnostic for this skill
    let diagnostic = await prisma.diagnostic.findUnique({
      where: { skillName }
    });

    if (!diagnostic) {
      // Generate one
      const prompt = `Generate a diagnostic quiz for the skill: ${skillName}`;
      const generated = await callAI('understanding', prompt, aiDiagnosticQuizSchema, DIAGNOSTIC_SYSTEM_PROMPT);

      diagnostic = await prisma.diagnostic.create({
        data: {
          skillName,
          difficulty: 3, // average difficulty
          questions: generated.questions as any,
        }
      });
    }

    // Return the quiz but strip the correct answers so the client can't cheat
    const clientQuestions = (diagnostic.questions as any[]).map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      difficulty: q.difficulty
    }));

    return NextResponse.json({
      diagnosticId: diagnostic.id,
      skillName: diagnostic.skillName,
      questions: clientQuestions
    });

  } catch (error: any) {
    console.error('[API Diagnostic Generate]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
