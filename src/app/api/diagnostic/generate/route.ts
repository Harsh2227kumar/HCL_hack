import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { selectSkillsForDiagnostic, ClaimedSkill, SkillDependency } from '@/lib/core/diagnosticSelection';
import skillDependenciesData from '../../../../../data/skill_dependencies.json';
import { callAI } from '@/lib/ai/callAI';

const QuestionSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
    explanation: z.string()
  }))
});

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const skills = await prisma.learnerSkill.findMany({ where: { userId } });
    if (!skills.length) return NextResponse.json({ error: 'No skills found' }, { status: 404 });

    const claimedSkills: ClaimedSkill[] = skills.map(s => ({
      skill_name: s.skillName,
      self_rated_level: s.selfRatedLevel,
      target_level: s.targetLevel,
      confidence_score: s.confidenceScore
    }));
    
    const dependencies: SkillDependency[] = (skillDependenciesData as any[]).map(d => ({
      skill_name: d.skill_name,
      depends_on_skill_name: d.depends_on_skill_name
    }));

    const selected = selectSkillsForDiagnostic(claimedSkills, dependencies, 1);
    if (!selected.length) return NextResponse.json({ questions: [] });

    const targetSkill = selected[0];
    const prompt = `Generate 5 multiple-choice questions to assess a learner's knowledge in "${targetSkill}". Include 4 options per question, the correct answer, and a short explanation.`;

    const aiRes = await callAI('understanding', prompt, QuestionSchema);
    
    if (Array.isArray(aiRes)) throw new Error('Expected structured data from callAI');

    return NextResponse.json({
      skillName: targetSkill,
      questions: aiRes.data.questions
    });

  } catch (error: any) {
    console.error('Error generating diagnostic:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
