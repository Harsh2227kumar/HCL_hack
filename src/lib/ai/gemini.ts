import { GoogleGenAI } from '@google/genai';

// Support comma-separated list of API keys for rotation
const getKeys = (envStr: string | undefined): string[] => {
  if (!envStr) return [];
  return envStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

const apiKeys = getKeys(process.env.GEMINI_API_KEY);
let currentKeyIndex = 0;

export async function callGemini(prompt: string, systemPrompt?: string, responseSchema?: any): Promise<string> {
  if (apiKeys.length === 0) throw new Error("GEMINI_API_KEY is not set.");
  
  const model = 'gemini-3.6-flash';
  const config: any = {};
  
  if (systemPrompt) {
    config.systemInstruction = systemPrompt;
  }
  if (responseSchema) {
    config.responseMimeType = 'application/json';
  }

  // Try keys sequentially if one fails
  for (let i = 0; i < apiKeys.length; i++) {
    const keyToTry = apiKeys[(currentKeyIndex + i) % apiKeys.length];
    const client = new GoogleGenAI({ apiKey: keyToTry });
    
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      // If successful, stick to this key
      currentKeyIndex = (currentKeyIndex + i) % apiKeys.length;
      return response.text || '';
    } catch (err: any) {
      console.warn(`[Gemini] API Key (ending in ...${keyToTry.slice(-4)}) failed. Switching to next key...`);
      // If we've tried all keys, throw the final error so it can failover to Groq
      if (i === apiKeys.length - 1) {
        throw err;
      }
    }
  }

  throw new Error("All Gemini API keys exhausted or failed.");
}
