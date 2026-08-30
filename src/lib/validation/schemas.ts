import { z } from 'zod';

export const chatRequestSchema = z.object({
  userId: z.string(),
  message: z.string(),
  conversationHistory: z.array(z.any()).optional(),
});

export const profileExtractSchema = z.object({
  userId: z.string(),
  text: z.string(),
});

export const diagnosticGenerateSchema = z.object({
  userId: z.string(),
  skillName: z.string(),
});

export const diagnosticSubmitSchema = z.object({
  userId: z.string(),
  skillName: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedAnswer: z.string(),
    })
  ),
});

export const reconcileSchema = z.object({
  userId: z.string(),
});

export const evidenceSchema = z.object({
  userId: z.string(),
  skillName: z.string(),
});

export const recommendSchema = z.object({
  userId: z.string(),
});

export const pathGenerateSchema = z.object({
  userId: z.string(),
});

export const progressSchema = z.object({
  userId: z.string(),
  resourceId: z.string(),
  eventType: z.enum(['started', 'completed', 'too_easy', 'too_hard', 'skipped', 'diagnostic_taken']),
  score: z.number().optional(),
});

export const goalChangeSchema = z.object({
  userId: z.string(),
  newGoal: z.string(),
  newGoalTemplateId: z.string().optional(),
});

export const explainCompareSchema = z.object({
  userId: z.string(),
  resourceIdA: z.string(),
  resourceIdB: z.string(),
});

export const explainTraceSchema = z.object({
  userId: z.string(),
  resourceId: z.string(),
});

export const dashboardSchema = z.object({
  userId: z.string(),
});

// Zod schemas for AI response parsing
export const aiExtractedProfileSchema = z.object({
  goal: z.string(),
  weeklyHours: z.number().nullable(),
  learningStyle: z.string().nullable(),
  skills: z.array(z.object({
    skillName: z.string(),
    selfRatedLevel: z.number()
  }))
});

export const aiDiagnosticQuizSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
    explanation: z.string(),
    difficulty: z.number()
  }))
});

export const aiExplanationSchema = z.object({
  reason: z.string(),
});

export const aiCounterfactualSchema = z.object({
  comparison: z.string(),
});

export const aiChatResponseSchema = z.object({
  message: z.string(),
  quick_replies: z.array(z.string()).optional(),
  done: z.boolean(),
});

