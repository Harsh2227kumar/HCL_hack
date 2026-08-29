import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callAI } from '../../../lib/ai/callAI';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  thought?: string;
  input?: {
    type: 'single_select_with_text' | 'multi_select_with_text' | 'text' | 'single_select' | 'multi_select';
    options?: string[];
    allow_custom?: boolean;
    placeholder?: string;
  };
  quick_replies?: string[];
}

export interface ExtractedProfileState {
  goal?: string;
  current_skills?: string[];
  missing_skills?: string[];
  experience_level?: string;
  weekly_hours?: number;
  time_flexibility?: string;
  target_timeline?: string;
  learning_style?: string;
  notes_and_constraints?: string;
}

const AdvisorResponseSchema = z.object({
  response_type: z
    .enum(['question', 'clarification', 'options', 'roadmap', 'message'])
    .default('question'),
  message: z
    .string()
    .nullish()
    .transform((val) => val || "What technology domain or career goal are you aiming for?"),
  thought: z
    .string()
    .nullish()
    .transform(
      (val) =>
        val ||
        "Analyzing learner goal, technical baseline, schedule constraints, and curriculum readiness."
    ),
  input: z
    .object({
      type: z
        .enum(['single_select_with_text', 'multi_select_with_text', 'text', 'single_select', 'multi_select'])
        .default('single_select_with_text'),
      options: z.array(z.string()).nullish().transform((val) => val || []),
      allow_custom: z.boolean().default(true),
      placeholder: z.string().nullish().transform((val) => val || "Or describe in your own words..."),
    })
    .default({
      type: 'single_select_with_text',
      options: [
        'AI Engineering & LLMs',
        'Full Stack Web Development',
        'Cloud & DevOps Architecture',
        'Data Science & Analytics',
      ],
      allow_custom: true,
      placeholder: 'Or tell me your dream career target...',
    }),
  profile_state: z
    .object({
      goal: z.string().nullish().transform((v) => v || undefined),
      current_skills: z.array(z.string()).nullish().transform((v) => v || []),
      missing_skills: z.array(z.string()).nullish().transform((v) => v || []),
      experience_level: z.string().nullish().transform((v) => v || 'Beginner'),
      weekly_hours: z.number().nullish().transform((v) => v || 10),
      time_flexibility: z.string().nullish().transform((v) => v || undefined),
      target_timeline: z.string().nullish().transform((v) => v || undefined),
      learning_style: z.string().nullish().transform((v) => v || undefined),
      notes_and_constraints: z.string().nullish().transform((v) => v || undefined),
    })
    .default({
      goal: undefined,
      current_skills: [],
      missing_skills: [],
      experience_level: 'Beginner',
      weekly_hours: 10,
      time_flexibility: undefined,
      target_timeline: undefined,
      learning_style: undefined,
      notes_and_constraints: undefined,
    }),
  is_ready_for_roadmap: z
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
        response_type: 'question',
        message: "Hey! I'm your AI Learning Path & Career Advisor. What domain or technology are you looking to master?",
        thought: "Initial state: Unknown user goal and background. Asking for primary domain with tailored starter options.",
        input: {
          type: 'single_select_with_text',
          options: [
            "AI Engineering & LLMs",
            "Full Stack Web Development",
            "Cloud & DevOps Architecture",
            "Data Science & Machine Learning"
          ],
          allow_custom: true,
          placeholder: "Or tell me your specific career goal (e.g. 'Placement prep in 6 months')..."
        },
        profile_state: {
          experience_level: 'Beginner',
          weekly_hours: 10
        },
        is_ready_for_roadmap: false,
        provider: "gemini",
        // Backward compatibility
        reply: "Hey! I'm your AI Learning Path & Career Advisor. What domain or technology are you looking to master?",
        quick_replies: [
          "AI Engineering & LLMs",
          "Full Stack Web Development",
          "Cloud & DevOps Architecture",
          "Data Science & Machine Learning"
        ],
        is_complete: false,
      });
    }

    const conversationHistory = messages
      .map((m) => `${m.role === 'user' ? 'Learner' : 'Advisor'}: ${m.text}`)
      .join('\n');

    const prompt = `You are a world-class AI Career Advisor & Learning Path Architect (like ChatGPT/Claude).
You do NOT follow a rigid form or a fixed question bank. You conduct a real, intelligent conversation where YOU decide what to ask and why.

CONVERSATION TRANSCRIPT:
${conversationHistory}

CORE ARCHITECTURE & REASONING PRINCIPLES:
1. Maintain an internal mental model:
   - What do you know so far? (Target goal, background, specific tools, weekly hours, schedule flexibility, deadlines, preferred learning style)
   - What is missing or uncertain that would MATERIALLY CHANGE the roadmap?
   - If a question would not significantly alter the curriculum, DO NOT ask it.
   - If the user changes or contradicts prior info (e.g. "actually mujhe JS nahi aati" or "schedule fixed nahi hai, exams me 2 hrs"), adapt gracefully, update the profile, and never restart.
2. Tone & Language:
   - Warm, expert, concise (2-3 sentences max).
   - Match the user's language naturally (Hinglish or English).
3. Dynamic Input Options:
   - YOU generate the options dynamically based on the exact conversation context.
   - For technical background: generate options relevant to the specific domain (e.g. if AI: ["Complete Beginner", "Python Basics", "Python + PyTorch", "Senior Engineer switching to AI"]).
   - If asking which tools they have used, you can use "multi_select_with_text" with relevant technologies.
   - If asking about time/schedule: ["2-5 hrs/week (Light)", "5-10 hrs/week (Moderate)", "10-20 hrs/week (Intensive)", "Flexible / Irregular"].
   - Always provide allow_custom: true with a helpful placeholder.
4. When to Build Roadmap:
   - Once you have enough clarity on: (A) Target Domain/Goal, (B) Current Technical Baseline, (C) Realistic Time Commitment / Flexibility, and (D) Core Learning Preferences or Target Timeline (typically after 2 to 4 thoughtful exchanges), set "is_ready_for_roadmap": true.
   - When is_ready_for_roadmap is true, provide an encouraging summary of their personalized profile in "message" and set input.options to [].

JSON OUTPUT SPECIFICATION:
Respond with valid JSON satisfying:
{
  "response_type": "question" | "clarification" | "options" | "roadmap" | "message",
  "message": "Your conversational reply or question",
  "thought": "Your internal mental model reasoning: what is known, what is missing, and why you are asking this",
  "input": {
    "type": "single_select_with_text" | "multi_select_with_text" | "text" | "single_select" | "multi_select",
    "options": ["Dynamic Option 1", "Dynamic Option 2", ...],
    "allow_custom": true,
    "placeholder": "Helpful placeholder text..."
  },
  "profile_state": {
    "goal": "...",
    "current_skills": ["Skill1", "Skill2"],
    "missing_skills": ["Missing1"],
    "experience_level": "Beginner" | "Intermediate" | "Advanced",
    "weekly_hours": 10,
    "time_flexibility": "e.g. Flexible 5-12 hrs, lower during exams",
    "target_timeline": "e.g. 6 months",
    "learning_style": "e.g. Hands-on Projects",
    "notes_and_constraints": "..."
  },
  "is_ready_for_roadmap": boolean
}`;

    const aiResult = await callAI('understanding', prompt, AdvisorResponseSchema);

    if (Array.isArray(aiResult)) {
      throw new Error('Unexpected embedding response');
    }

    const resData = aiResult.data;
    let isReady = Boolean(resData.is_ready_for_roadmap);

    // Guard: ensure ready doesn't fire prematurely on turn 1 unless exhaustive detail was provided
    if (userMessageCount < 2 && isReady) {
      const lastText = userMessages[userMessages.length - 1]?.text || '';
      if (lastText.length < 80) {
        isReady = false;
      }
    }

    return NextResponse.json({
      response_type: resData.response_type,
      message: resData.message,
      thought: resData.thought,
      input: resData.input,
      profile_state: resData.profile_state,
      is_ready_for_roadmap: isReady,
      provider: aiResult.provider,
      // Backward compatibility fields
      reply: resData.message,
      quick_replies: resData.input?.options || [],
      is_complete: isReady,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error in /api/chat route:', errMsg);

    const body = await request.clone().json().catch(() => ({ messages: [] }));
    const messages: ChatMessage[] = body.messages || [];
    const userCount = messages.filter((m) => m.role === 'user').length;

    let fallbackMsg = "Great! Where are you starting from in terms of technical experience?";
    let fallbackThought = "Determining baseline technical capability to calibrate roadmap prerequisites.";
    let fallbackInput: {
      type: 'single_select_with_text' | 'multi_select_with_text' | 'text' | 'single_select' | 'multi_select';
      options: string[];
      allow_custom: boolean;
      placeholder: string;
    } = {
      type: 'single_select_with_text',
      options: ["Complete Beginner", "Know Basics & Syntax", "Comfortable Building Projects", "Professional Developer"],
      allow_custom: true,
      placeholder: "Or tell me about what you've built so far..."
    };
    let fallbackReady = false;

    if (userCount === 2) {
      fallbackMsg = "Understood! How much time can you realistically invest per week, and does your availability fluctuate?";
      fallbackThought = "Calibrating weekly velocity and pacing constraints.";
      fallbackInput = {
        type: 'single_select_with_text' as const,
        options: ["5-10 hours/week", "10-15 hours/week", "15-20 hours/week", "Fluctuating / Exam periods"],
        allow_custom: true,
        placeholder: "Or describe your typical weekly routine..."
      };
    } else if (userCount === 3) {
      fallbackMsg = "What is your primary timeline and how do you prefer to learn best?";
      fallbackThought = "Finalizing pedagogical style and target completion milestone.";
      fallbackInput = {
        type: 'single_select_with_text' as const,
        options: ["Hands-on Projects & Labs", "Interactive Coding Challenges", "Video Tutorials & Visual", "Reading Docs & Papers"],
        allow_custom: true,
        placeholder: "Or specify your target deadline (e.g. Job in 6 months)..."
      };
    } else if (userCount >= 4) {
      fallbackMsg = "Perfect! I have a comprehensive mental model of your goals and background. Let's build your personalized curriculum.";
      fallbackThought = "All requisite dimensions mapped with high fidelity. Generating roadmap.";
      fallbackInput = {
        type: 'text' as const,
        options: [],
        allow_custom: false,
        placeholder: ""
      };
      fallbackReady = true;
    }

    return NextResponse.json({
      response_type: fallbackReady ? 'roadmap' : 'question',
      message: fallbackMsg,
      thought: fallbackThought,
      input: fallbackInput,
      profile_state: {
        experience_level: 'Intermediate',
        weekly_hours: 10
      },
      is_ready_for_roadmap: fallbackReady,
      provider: 'mock',
      reply: fallbackMsg,
      quick_replies: fallbackInput.options,
      is_complete: fallbackReady,
    });
  }
}
