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

function getQuestionCount(totalSkills: number, index: number): number {
  if (totalSkills <= 1) return 5;
  if (totalSkills === 2) return 3;
  if (totalSkills === 3) return 3;
  if (totalSkills === 4) return index < 2 ? 3 : 2;
  if (totalSkills >= 5) return 2;
  return 3;
}

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
    
    const dependencies: SkillDependency[] = (skillDependenciesData as Array<{ skill_name: string; depends_on_skill_name: string }>).map(d => ({
      skill_name: d.skill_name,
      depends_on_skill_name: d.depends_on_skill_name
    }));

    const topN = Math.min(5, claimedSkills.length);
    const selected = selectSkillsForDiagnostic(claimedSkills, dependencies, topN);
    if (!selected.length) return NextResponse.json({ skillBatches: [] });

    const skillBatches = [];

    for (let i = 0; i < selected.length; i++) {
      const targetSkill = selected[i];
      const count = getQuestionCount(selected.length, i);
      const prompt = `Generate ${count} multiple-choice questions to assess a learner's knowledge in "${targetSkill}". Include 4 options per question, the correct answer, and a short explanation.`;

      let rawQuestions: Array<{ question: string; options: string[]; correctAnswer: string; explanation: string }> = [];
      let isFallback = false;

      try {
        const aiRes = await callAI('understanding', prompt, QuestionSchema);
        if (!Array.isArray(aiRes) && aiRes?.data?.questions?.length > 0) {
          rawQuestions = aiRes.data.questions.slice(0, count);
        } else {
          throw new Error('AI response empty');
        }
      } catch {
        console.warn(`[diagnostic/generate] AI generation failed for ${targetSkill}, using curated fallback.`);
        isFallback = true;
        const fallbackPool = [
          {
            question: `What is the core principle or purpose of ${targetSkill}?`,
            options: [
              `To establish structured patterns, reliable execution, and core abstractions in ${targetSkill}.`,
              `To bypass all safety checks and compilation stages in production environments.`,
              `To execute unverified bytecode directly without memory management.`,
              `To convert synchronous relational schemas into flat binary streams.`
            ],
            correctAnswer: `To establish structured patterns, reliable execution, and core abstractions in ${targetSkill}.`,
            explanation: `Understanding the fundamental design principles and abstractions of ${targetSkill} is critical for robust application development.`
          },
          {
            question: `When implementing ${targetSkill}, which consideration is most important for maintainability?`,
            options: [
              `Adhering to deterministic interfaces, modular isolation, and testable boundaries.`,
              `Hardcoding environment parameters directly inside root modules.`,
              `Disabling error logging to reduce disk write cycles.`,
              `Duplicating domain state across independent worker nodes without synchronization.`
            ],
            correctAnswer: `Adhering to deterministic interfaces, modular isolation, and testable boundaries.`,
            explanation: `Modular isolation and clear interfaces prevent regression and decouple complex dependencies.`
          },
          {
            question: `How does intermediate mastery in ${targetSkill} translate to system reliability?`,
            options: [
              `Ensures proper error handling, resource lifecycle management, and predictable latency.`,
              `Guarantees that no CPU cycles will be consumed during peak workloads.`,
              `Automatically resolves cross-origin network failures at the OS kernel level.`,
              `Replaces database transaction guarantees with local in-memory caches.`
            ],
            correctAnswer: `Ensures proper error handling, resource lifecycle management, and predictable latency.`,
            explanation: `Reliable systems depend on disciplined error recovery and proper lifecycle resource management.`
          }
        ];
        rawQuestions = fallbackPool.slice(0, count);
      }

      const formattedQuestions = rawQuestions.map((q, qIndex) => ({
        questionId: `${targetSkill}-q${qIndex}`,
        skillName: targetSkill,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }));

      skillBatches.push({
        skillName: targetSkill,
        questions: formattedQuestions,
        isFallback
      });
    }

    return NextResponse.json({ skillBatches });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error generating diagnostic:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

