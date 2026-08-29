import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '@/lib/ai/callAI';
import { prisma } from '@/lib/prisma';
import goalTemplates from '../../../../../data/goal_templates.json';

const ExtractedProfileSchema = z.object({
  goal: z
    .string()
    .nullish()
    .transform((val) => (val && val.trim().length > 0 ? val : 'AI Engineering & Machine Learning')),
  weeklyHours: z
    .union([z.number(), z.string()])
    .nullish()
    .transform((val) => {
      if (typeof val === 'number' && val > 0) return val;
      if (typeof val === 'string') {
        const matches = val.match(/\d+/g);
        if (matches && matches.length > 0) {
          const num = parseInt(matches[0], 10);
          if (num > 0 && num <= 60) return num;
        }
      }
      return 10; // Default sensible commitment
    }),
  learningStyle: z
    .string()
    .nullish()
    .transform((val) => (val && val.trim().length > 0 ? val : 'Interactive Coding & Projects')),
  experienceLevel: z
    .string()
    .nullish()
    .transform((val) => {
      if (!val || typeof val !== 'string') return 'Intermediate';
      const lower = val.toLowerCase();
      if (lower.includes('beginner') || lower.includes('novice')) return 'Beginner';
      if (lower.includes('advanced') || lower.includes('senior') || lower.includes('expert')) return 'Advanced';
      return 'Intermediate';
    })
    .pipe(z.enum(['Beginner', 'Intermediate', 'Advanced'])),
  notes: z
    .string()
    .nullish()
    .transform((val) => val || undefined),
});

// Map experienceLevel string → selfRatedLevel integer (0-5 scale)
function experienceToSelfRated(experienceLevel: string): number {
  if (experienceLevel === 'Beginner') return 1;
  if (experienceLevel === 'Advanced') return 3;
  return 2; // intermediate default
}

// Find the closest matching goal template by keyword overlap
function findBestTemplate(goal: string): typeof goalTemplates[0] | null {
  const goalLower = goal.toLowerCase();

  // Try keyword-based matching first (covers partial matches)
  const keywordMap: Array<{ keywords: string[]; id: string }> = [
    { keywords: ['full stack', 'fullstack', 'full-stack', 'web development', 'web dev'], id: 'goal_full_stack' },
    { keywords: ['frontend', 'front-end', 'front end', 'react', 'ui developer'], id: 'goal_frontend' },
    { keywords: ['backend', 'back-end', 'back end', 'systems', 'architecture', 'api'], id: 'goal_backend' },
    { keywords: ['ai', 'ml', 'machine learning', 'deep learning', 'nlp', 'llm', 'genai'], id: 'goal_ml_engineer' },
    { keywords: ['devops', 'cloud', 'kubernetes', 'docker', 'infrastructure', 'devsecops'], id: 'goal_devops' },
    { keywords: ['data analyst', 'data engineer', 'analytics', 'data analytics', 'sql analyst'], id: 'goal_data_analyst' },
  ];

  for (const { keywords, id } of keywordMap) {
    if (keywords.some((kw) => goalLower.includes(kw))) {
      return goalTemplates.find((t) => t.id === id) || null;
    }
  }

  // Fallback: score every template by word overlap
  let bestTemplate: typeof goalTemplates[0] | null = null;
  let bestScore = 0;
  for (const template of goalTemplates) {
    const templateWords = template.goal_name.toLowerCase().split(/\s+/);
    const overlap = templateWords.filter((w) => goalLower.includes(w)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestTemplate = template;
    }
  }

  return bestTemplate;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const conversationText = messages
      .map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Learner' : 'Advisor'}: ${m.text}`)
      .join('\n');

    const prompt = `You are an expert educational analyst. Extract the learner's synthesized profile from this conversation transcript:

CONVERSATION:
${conversationText}

Extract and return a clean JSON object satisfying this schema:
- goal: The specific domain or career goal the learner wants to master (e.g. "AI Engineering & Machine Learning", "Full Stack Web Development", "Deep Learning & NLP", etc.)
- weeklyHours: Integer number of hours per week the learner can dedicate (if flexible or unspecified, use 10)
- learningStyle: Preferred learning modality (e.g. "Interactive Coding", "Hands-on Projects", "Video Courses", "Documentation")
- experienceLevel: Current baseline skill level (must be "Beginner", "Intermediate", or "Advanced")
- notes: Any special notes or extra details mentioned`;

    const response = await callAI('understanding', prompt, ExtractedProfileSchema);
    if (Array.isArray(response)) throw new Error('Expected structured response');

    const profileData = response.data;

    // Persist user and profile into Prisma
    const newUser = await prisma.user.create({
      data: {
        profile: {
          create: {
            goal: profileData.goal,
            weeklyHours: profileData.weeklyHours,
            learningStyle: profileData.learningStyle,
            experienceLevel: profileData.experienceLevel,
            notes: profileData.notes,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // ── Initialize LearnerSkill rows from goal template ──────────────────
    const selfRatedLevel = experienceToSelfRated(profileData.experienceLevel);
    const matchedTemplate = findBestTemplate(profileData.goal);

    let initializedSkills = 0;

    if (matchedTemplate && matchedTemplate.required_skills.length > 0) {
      // Use createMany with skipDuplicates to avoid collisions on (userId, skillName)
      const result = await prisma.learnerSkill.createMany({
        data: matchedTemplate.required_skills.map((rs) => ({
          userId: newUser.id,
          skillName: rs.skill,
          selfRatedLevel,
          observedLevel: null,
          confidenceScore: 0.25,
          finalEstimate: selfRatedLevel,
          targetLevel: rs.min_level,
        })),
        skipDuplicates: true,
      });
      initializedSkills = result.count;
    } else {
      // Generic fallback: 3 foundational skills when no template matches
      const fallbackSkills = [
        { skillName: 'Programming Fundamentals', targetLevel: 3 },
        { skillName: 'Problem Solving & Algorithms', targetLevel: 3 },
        { skillName: 'Version Control (Git)', targetLevel: 3 },
      ];
      const result = await prisma.learnerSkill.createMany({
        data: fallbackSkills.map((s) => ({
          userId: newUser.id,
          skillName: s.skillName,
          selfRatedLevel,
          observedLevel: null,
          confidenceScore: 0.25,
          finalEstimate: selfRatedLevel,
          targetLevel: s.targetLevel,
        })),
        skipDuplicates: true,
      });
      initializedSkills = result.count;
    }

    return NextResponse.json({
      success: true,
      profile: profileData,
      userId: newUser.id,
      provider: response.provider,
      initializedSkills,
      matchedTemplate: matchedTemplate?.goal_name || 'fallback',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in /api/profile/extract:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to extract profile' },
      { status: 500 }
    );
  }
}
