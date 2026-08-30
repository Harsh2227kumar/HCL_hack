import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { profileExtractSchema, aiExtractedProfileSchema } from '@/lib/validation/schemas';
import { callAI } from '@/lib/ai/callAI';

const EXTRACT_SYSTEM_PROMPT = `You are a precise skill extraction specialist. Extract ALL skills, technologies, and competencies from the provided conversation transcript.
For each skill:
- Normalize the name to lowercase (e.g., 'Python' -> 'python')
- Estimate their self-rated proficiency on a scale of 1-5
Extract their goal, weekly hours, and learning style.
Return ONLY valid JSON matching the schema.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = profileExtractSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId, text } = parsed.data;

    // 1. AI Extraction
    const extracted = await callAI('understanding', text, aiExtractedProfileSchema, EXTRACT_SYSTEM_PROMPT);

    // 2. Map to Goal Template (find closest match or use generic)
    const goalTemplate = await prisma.goalTemplate.findFirst({
      where: { goalName: { equals: extracted.goal, mode: 'insensitive' } }
    });

    const goalTemplateId = goalTemplate ? goalTemplate.id : null;

    // 3. Upsert LearnerProfile
    const profile = await prisma.learnerProfile.upsert({
      where: { userId },
      update: {
        goal: extracted.goal,
        goalTemplateId,
        weeklyHours: extracted.weeklyHours || 10,
        learningStyle: extracted.learningStyle || 'mixed',
      },
      create: {
        userId,
        goal: extracted.goal,
        goalTemplateId,
        weeklyHours: extracted.weeklyHours || 10,
        learningStyle: extracted.learningStyle || 'mixed',
      },
    });

    // 4. Create LearnerSkills and SkillEvidence
    for (const skill of extracted.skills) {
      // Find taxonomy match if possible
      const depMatch = await prisma.skillDependency.findFirst({
        where: { skillName: { equals: skill.skillName, mode: 'insensitive' } }
      });
      
      const normalizedSkillName = depMatch ? depMatch.skillName : skill.skillName;

      // Upsert Skill
      await prisma.learnerSkill.upsert({
        where: {
          userId_skillName: { userId, skillName: normalizedSkillName }
        },
        update: {
          selfRatedLevel: skill.selfRatedLevel,
          confidenceScore: 0.3,
          finalEstimate: skill.selfRatedLevel,
          targetLevel: 5,
        },
        create: {
          userId,
          skillName: normalizedSkillName,
          selfRatedLevel: skill.selfRatedLevel,
          confidenceScore: 0.3,
          finalEstimate: skill.selfRatedLevel,
          targetLevel: 5,
        }
      });

      // Add initial evidence
      await prisma.skillEvidence.create({
        data: {
          userId,
          skillName: normalizedSkillName,
          source: 'self_report',
          score: skill.selfRatedLevel,
          reliability: 0.3,
          recencyWeight: 1.0,
        }
      });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('[API Profile Extract]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
