import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '@/lib/ai/callAI';
import { prisma } from '@/lib/prisma';

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
    .transform((val) => (val && val.trim().length > 0 ? val : 'Intermediate')),
  notes: z
    .string()
    .nullish()
    .transform((val) => val || undefined),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const conversationText = messages
      .map((m: any) => `${m.role === 'user' ? 'Learner' : 'Advisor'}: ${m.text}`)
      .join('\n');

    const prompt = `You are an expert educational analyst. Extract the learner's synthesized profile from this conversation transcript:

CONVERSATION:
${conversationText}

Extract and return a clean JSON object satisfying this schema:
- goal: The specific domain or career goal the learner wants to master (e.g. "AI Engineering & Machine Learning", "Full Stack Web Development", "Deep Learning & NLP", etc.)
- weeklyHours: Integer number of hours per week the learner can dedicate (if flexible or unspecified, use 10)
- learningStyle: Preferred learning modality (e.g. "Interactive Coding", "Hands-on Projects", "Video Courses", "Documentation")
- experienceLevel: Current baseline skills & background (e.g. "Intermediate (Python & GenAI fundamentals)")
- notes: Any special notes mentioned`;

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
            notes: profileData.notes,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json({
      success: true,
      profile: profileData,
      userId: newUser.id,
      provider: response.provider,
    });
  } catch (error: any) {
    console.error('Error in /api/profile/extract:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to extract profile' },
      { status: 500 }
    );
  }
}
