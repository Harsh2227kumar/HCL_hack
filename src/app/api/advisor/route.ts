import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai/callAI';
import { z } from 'zod';

const ADVISOR_SYSTEM_PROMPT = `You are a helpful, expert AI learning assistant for a personalized learning platform.
Your goal is to answer the learner's questions about course content, career advice, technical concepts, or their learning path.
Be encouraging, clear, and concise. Format your answers with markdown if needed for readability.
Do NOT act like an onboarding bot. Answer their specific learning query directly.`;

const advisorRequestSchema = z.object({
  userId: z.string(),
  message: z.string(),
  conversationHistory: z.array(z.any()).optional(),
});

// Since this is a general chat, we don't need strict schema for the output like onboarding, 
// but callAI expects one. We'll use a simple wrapper.
const advisorResponseSchema = z.object({
  message: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = advisorRequestSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { message, conversationHistory } = parsed.data;

    let historyText = '';
    if (conversationHistory && conversationHistory.length > 0) {
      historyText = 'Previous conversation:\n' + conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n') + '\n\n';
    }

    const prompt = `${historyText}User: ${message}`;

    const response = await callAI('writing', prompt, advisorResponseSchema, ADVISOR_SYSTEM_PROMPT);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[API Advisor]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
