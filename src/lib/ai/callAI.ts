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
): Promise<T> {
  if (role === 'embedding') {
    try {
      console.log(`[callAI] Attempting Gemini embedding for text: ${prompt.substring(0, 60)}...`);
      return await getGeminiEmbedding(prompt) as unknown as T;
    } catch (error: any) {
      console.error(`[callAI] Gemini embedding failed:`, error.message);
      throw error;
    }
  }

  if (!schema) {
    throw new Error('Schema is required for understanding or writing roles');
  }

  const primaryProvider = role === 'understanding' ? callGemini : callGroq;
  const fallbackProvider = role === 'understanding' ? callGroq : callGemini;
  const primaryName = role === 'understanding' ? 'Gemini' : 'Groq';
  const fallbackName = role === 'understanding' ? 'Groq' : 'Gemini';

  try {
    console.log(`[callAI] Attempting ${primaryName} for role: ${role}`);
    return await primaryProvider(prompt, schema);
  } catch (error: any) {
    console.warn(`[callAI] ${primaryName} failed:`, error.message);
    console.warn(`[callAI] Falling back to ${fallbackName}...`);

    try {
      return await fallbackProvider(prompt, schema);
    } catch (fallbackError: any) {
      console.error(`[callAI] ${fallbackName} also failed:`, fallbackError.message);
      
      // Master Plan §6.5: "Final fallback: deterministic template/keyword-parse response if both providers are down."
      // To implement this generically across all schemas without crashing, we attempt an empty parse.
      console.error('[callAI] ALL PROVIDERS DOWN. Returning emergency template fallback.');
      try {
        return schema.parse({});
      } catch (templateError) {
        // If the schema requires specific fields and we can't stub them easily, we throw a structured error.
        throw new Error('All AI providers failed and emergency template could not satisfy the strict schema.');
      }
    }
  }
}
