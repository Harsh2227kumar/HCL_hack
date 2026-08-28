import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '@/lib/ai/callAI';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  quick_replies?: string[];
}

const ChatResponseSchema = z.object({
  reply: z
    .string()
    .nullish()
    .transform((val) => val || "What technology or topic would you like to explore?"),
  quick_replies: z
    .array(z.string())
    .nullish()
    .transform((val) => val || []),
  is_complete: z
    .boolean()
    .nullish()
    .transform((val) => Boolean(val)),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];
    const userMessages = messages.filter((m) => m.role === 'user');
    const userMessageCount = userMessages.length;

    // Initial greeting if no user messages yet
    if (userMessageCount === 0) {
      return NextResponse.json({
        reply: "Hey! I'm your AI Academic Advisor. What domain or technology are you looking to master today?",
        quick_replies: [
          "AI Engineering & LLMs",
          "Full Stack Web Development",
          "Cloud & DevOps Architecture",
          "Data Science & Machine Learning",
        ],
        is_complete: false,
        provider: "gemini",
      });
    }

    const conversationHistory = messages
      .map((m) => `${m.role === 'user' ? 'Learner' : 'Advisor'}: ${m.text}`)
      .join('\n');

    const prompt = `You are a world-class AI Academic Advisor & Learning Architect (like ChatGPT/Gemini).
Your role is to guide the learner through a natural, engaging conversation to understand their learning needs and craft their customized curriculum.

CONVERSATION TRANSCRIPT:
${conversationHistory}

RULES FOR YOUR NEXT RESPONSE:
1. Speak in a warm, expert, concise tone (2-3 sentences max). Address the user's specific answers directly.
2. We need 4 core pieces of information to build their path:
   - [A] Domain / Goal (e.g. AI Engineering, Web Dev, Cloud)
   - [B] Current Baseline / Experience (e.g. Beginner, Knows Python, Senior Dev)
   - [C] Weekly Time Commitment (e.g. 5-10 hrs, 15 hrs/week)
   - [D] Preferred Learning Modality (e.g. Interactive Coding, Hands-on Projects, Video Courses)
3. Step through these naturally:
   - If [A] is known but [B] is missing: Ask enthusiastically about their background with relevant tech for that domain. Provide 3-4 tailored experience quick_replies.
   - If [A] & [B] are known but [C] is missing: Acknowledge their background and ask how many hours per week they can dedicate. Provide 3-4 realistic hour options in quick_replies.
   - If [A], [B] & [C] are known but [D] is missing: Ask how they prefer to learn. Provide 3-4 learning style options in quick_replies.
   - If all 4 [A, B, C, D] are now known (or the learner has answered at least 3 thoughtful questions):
     Give a motivating summary of their personalized profile, congratulate them, and set "is_complete": true. Set quick_replies to [].
4. DO NOT set "is_complete": true on turn 1 or 2 unless the user explicitly gave all 4 pieces of information in a single detailed message.

Respond with valid JSON satisfying the schema: { "reply": "...", "quick_replies": [...], "is_complete": boolean }`;

    const aiResult = await callAI('understanding', prompt, ChatResponseSchema);

    if (Array.isArray(aiResult)) {
      throw new Error('Unexpected embedding response');
    }

    // Safety guard: ensure is_complete doesn't fire prematurely on turn 1
    let isComplete = Boolean(aiResult.data.is_complete);
    if (userMessageCount < 3 && isComplete) {
      // Check if user gave an exhaustive multi-sentence message
      const lastText = userMessages[userMessages.length - 1]?.text || '';
      if (lastText.length < 50) {
        isComplete = false;
      }
    }

    return NextResponse.json({
      reply: aiResult.data.reply,
      quick_replies: aiResult.data.quick_replies || [],
      is_complete: isComplete,
      provider: aiResult.provider,
    });
  } catch (error: any) {
    console.error('Error in /api/chat route:', error.message);

    const body = await request.clone().json().catch(() => ({ messages: [] }));
    const messages: ChatMessage[] = body.messages || [];
    const userCount = messages.filter((m) => m.role === 'user').length;

    let fallbackReply = "What's your current experience level with this topic?";
    let fallbackQuick = ["Complete Beginner", "Intermediate (Some knowledge)", "Advanced / Professional"];
    let fallbackDone = false;

    if (userCount === 2) {
      fallbackReply = "Got it! How many hours per week can you dedicate to this learning path?";
      fallbackQuick = ["5-10 hours/week", "10-15 hours/week", "15-20 hours/week", "20+ hours/week"];
    } else if (userCount === 3) {
      fallbackReply = "What's your preferred way to learn?";
      fallbackQuick = ["Interactive Coding & Projects", "Hands-on Building", "Video Courses", "Reading Documentation"];
    } else if (userCount >= 4) {
      fallbackReply = "Awesome! I have all your details and am assembling your adaptive curriculum.";
      fallbackQuick = [];
      fallbackDone = true;
    }

    return NextResponse.json({
      reply: fallbackReply,
      quick_replies: fallbackQuick,
      is_complete: fallbackDone,
      provider: 'mock',
    });
  }
}
