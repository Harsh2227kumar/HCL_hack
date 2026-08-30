import { z } from 'zod';
import { callGemini } from './gemini';
import { callGroq } from './groq';

class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

// Simple circuit breaker state
let geminiFailures = 0;
let groqFailures = 0;
let geminiCooldownUntil = 0;
let groqCooldownUntil = 0;

const COOLDOWN_MS = 30000;

async function executeWithFailover(
  primary: () => Promise<string>,
  fallback: () => Promise<string>,
  primaryName: 'gemini' | 'groq'
): Promise<string> {
  const now = Date.now();
  const primaryOnCooldown = primaryName === 'gemini' ? now < geminiCooldownUntil : now < groqCooldownUntil;
  
  if (!primaryOnCooldown) {
    try {
      const result = await primary();
      if (primaryName === 'gemini') geminiFailures = 0;
      else groqFailures = 0;
      return result;
    } catch (error) {
      console.warn(`[callAI] ${primaryName} failed:`, error);
      if (primaryName === 'gemini') {
        geminiFailures++;
        if (geminiFailures >= 2) geminiCooldownUntil = now + COOLDOWN_MS;
      } else {
        groqFailures++;
        if (groqFailures >= 2) groqCooldownUntil = now + COOLDOWN_MS;
      }
    }
  }

  // Fallback
  const fallbackName = primaryName === 'gemini' ? 'groq' : 'gemini';
  const fallbackOnCooldown = fallbackName === 'gemini' ? now < geminiCooldownUntil : now < groqCooldownUntil;
  
  if (!fallbackOnCooldown) {
    try {
      const result = await fallback();
      if (fallbackName === 'gemini') geminiFailures = 0;
      else groqFailures = 0;
      return result;
    } catch (error) {
      console.warn(`[callAI] ${fallbackName} (fallback) failed:`, error);
      if (fallbackName === 'gemini') {
        geminiFailures++;
        if (geminiFailures >= 2) geminiCooldownUntil = now + COOLDOWN_MS;
      } else {
        groqFailures++;
        if (groqFailures >= 2) groqCooldownUntil = now + COOLDOWN_MS;
      }
    }
  }

  throw new AIUnavailableError('Both AI providers are unavailable or on cooldown.');
}

/**
 * The single unified AI abstraction layer for the Adaptive Learning Intelligence Engine.
 * 
 * @param role 'understanding' (Gemini) or 'writing' (Groq)
 * @param prompt The system/user prompt combined
 * @param schema The Zod schema that the LLM response must strictly adhere to
 * @param systemPrompt Optional system instruction
 * @returns A parsed object matching the Zod schema
 */
export async function callAI<T>(
  role: 'understanding' | 'writing',
  prompt: string,
  schema: z.ZodType<T>,
  systemPrompt?: string
): Promise<T> {
  
  const enforceJSONPrompt = prompt + '\n\nIMPORTANT: You must return valid JSON that exactly matches this structure. Do not wrap it in markdown code blocks, just raw JSON:\n' + JSON.stringify(schema);
  
  const geminiCall = () => callGemini(enforceJSONPrompt, systemPrompt, true);
  const groqCall = () => callGroq(enforceJSONPrompt, systemPrompt, true);

  const primaryCall = role === 'understanding' ? geminiCall : groqCall;
  const fallbackCall = role === 'understanding' ? groqCall : geminiCall;
  const primaryName = role === 'understanding' ? 'gemini' : 'groq';

  let rawResponse = '';
  
  try {
    rawResponse = await executeWithFailover(primaryCall, fallbackCall, primaryName);
  } catch (error) {
    if (error instanceof AIUnavailableError) {
      throw error;
    }
    throw error;
  }

  // Try parsing
  try {
    // Strip markdown code blocks if LLM still returned them
    const cleaned = rawResponse.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    const parsedJson = JSON.parse(cleaned);
    return schema.parse(parsedJson);
  } catch (parseError) {
    console.warn('[callAI] First parse failed, retrying once...', parseError);
    // Retry once on parse failure
    try {
      const retryPrompt = `The previous response failed JSON/Schema validation. Error: ${parseError}. Please try again and return ONLY valid JSON matching the exact schema requested.`;
      const retryGemini = () => callGemini(retryPrompt + '\n' + enforceJSONPrompt, systemPrompt, true);
      const retryGroq = () => callGroq(retryPrompt + '\n' + enforceJSONPrompt, systemPrompt, true);
      
      const secondRaw = await executeWithFailover(
        role === 'understanding' ? retryGemini : retryGroq,
        role === 'understanding' ? retryGroq : retryGemini,
        primaryName
      );
      
      const cleaned = secondRaw.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      const parsedJson = JSON.parse(cleaned);
      return schema.parse(parsedJson);
    } catch (secondError) {
      console.error('[callAI] Second parse failed. Aborting.', secondError);
      throw new Error(`Failed to parse AI response into schema: ${secondError}`);
    }
  }
}
