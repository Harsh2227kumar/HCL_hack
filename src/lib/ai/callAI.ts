import { z } from 'zod';
import { callGemini, getGeminiEmbedding } from './gemini';
import { callGroq } from './groq';

/**
 * The single unified AI abstraction layer for the Adaptive Learning Intelligence Engine.
 * Implements fallback and retry logic per Master Plan §6.4 & §6.5.
 * 
 * @param role 'understanding' (Gemini primary), 'writing' (Groq primary), or 'embedding' (Gemini text-embedding-004)
 * @param prompt The system/user prompt combined, or target text for embedding
 * @param schema The Zod schema that the LLM response must strictly adhere to (optional for embedding)
 * @returns A parsed object matching the Zod schema, or a number[] vector for embedding
 */
export async function callAI<T>(
  role: 'understanding' | 'writing' | 'embedding',
  prompt: string,
  schema?: z.ZodType<T>
): Promise<{ data: T; provider: 'gemini' | 'groq' | 'mock' } | number[]> {
  if (role === 'embedding') {
    try {
      console.log(`[callAI] Attempting Gemini embedding for text: ${prompt.substring(0, 60)}...`);
      return await getGeminiEmbedding(prompt);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[callAI] Gemini embedding failed:`, errMsg);
      throw error;
    }
  }

  if (!schema) {
    throw new Error('Schema is required for understanding or writing roles');
  }

  const primaryProvider = role === 'understanding' ? callGemini : callGroq;
  const fallbackProvider = role === 'understanding' ? callGroq : callGemini;
  const primaryName = role === 'understanding' ? 'gemini' : 'groq';
  const fallbackName = role === 'understanding' ? 'groq' : 'gemini';

  try {
    console.log(`[callAI] Attempting ${primaryName} for role: ${role}`);
    const data = await primaryProvider(prompt, schema);
    return { data, provider: primaryName };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn(`[callAI] ${primaryName} failed:`, errMsg);
    console.warn(`[callAI] Falling back to ${fallbackName}...`);

    try {
      const data = await fallbackProvider(prompt, schema);
      return { data, provider: fallbackName };
    } catch (fallbackError: unknown) {
      const fallbackErrMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      console.error(`[callAI] ${fallbackName} also failed:`, fallbackErrMsg);
      
      console.error('[callAI] ALL PROVIDERS DOWN. Returning emergency template fallback.');
      try {
        const data = schema.parse({});
        return { data, provider: 'mock' };
      } catch {
        throw new Error('All AI providers failed and emergency template could not satisfy the strict schema.');
      }
    }
  }
}
