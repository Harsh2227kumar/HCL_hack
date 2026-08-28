import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '@/lib/ai/callAI';

const ExtractedProfileSchema = z.object({
  goal: z.string().default('Master Full Stack Engineering'),
  weeklyHours: z.number().default(10),
  learningStyle: z.string().default('Project-based'),
  experienceLevel: z.string().default('Intermediate'),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];

    const prompt = `Extract learner profile details from this onboarding conversation transcript:
${JSON.stringify(messages, null, 2)}

Return structured object with:
- goal (string)
- weeklyHours (number)
- learningStyle (string)
- experienceLevel (string)`;

    const extractedProfile = await callAI('understanding', prompt, ExtractedProfileSchema);

    return NextResponse.json({
      success: true,
      profile: extractedProfile,
    });
  } catch (error) {
    console.error('Error in /api/profile/extract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract profile' },
      { status: 500 }
    );
  }
}
