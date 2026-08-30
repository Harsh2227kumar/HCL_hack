import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

// We instantiate it once.
export const geminiClient = new GoogleGenAI({ apiKey });

export async function callGemini(prompt: string, systemPrompt?: string, responseSchema?: any): Promise<string> {
  const model = 'gemini-2.5-flash';
  
  const config: any = {};
  if (systemPrompt) {
    config.systemInstruction = systemPrompt;
  }
  
  if (responseSchema) {
    config.responseMimeType = 'application/json';
    // The exact format depends on the GenAI SDK. We can just ask it to return JSON for now
    // and rely on Zod to parse it in callAI.ts
  }

  const response = await geminiClient.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  return response.text || '';
}
