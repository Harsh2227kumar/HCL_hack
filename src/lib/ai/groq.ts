import Groq from 'groq-sdk';

const getKeys = (envStr: string | undefined): string[] => {
  if (!envStr) return [];
  return envStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

const apiKeys = getKeys(process.env.GROQ_API_KEY);
let currentKeyIndex = 0;

export async function callGroq(prompt: string, systemPrompt?: string, responseSchema?: any): Promise<string> {
  if (apiKeys.length === 0) throw new Error("GROQ_API_KEY is not set.");
  
  const model = 'openai/gpt-oss-120b';
  
  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  for (let i = 0; i < apiKeys.length; i++) {
    const keyToTry = apiKeys[(currentKeyIndex + i) % apiKeys.length];
    const client = new Groq({ apiKey: keyToTry });
    
    try {
      const completion = await client.chat.completions.create({
        messages,
        model,
        response_format: responseSchema ? { type: 'json_object' } : undefined,
        max_tokens: 4096,
      });
      currentKeyIndex = (currentKeyIndex + i) % apiKeys.length;
      return completion.choices[0]?.message?.content || '';
    } catch (err: any) {
      console.warn(`[Groq] API Key (ending in ...${keyToTry.slice(-4)}) failed. Switching to next key...`);
      if (i === apiKeys.length - 1) {
        throw err;
      }
    }
  }

  throw new Error("All Groq API keys exhausted or failed.");
}
