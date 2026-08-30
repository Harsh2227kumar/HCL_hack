import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || '';

export const groqClient = new Groq({ apiKey });

export async function callGroq(prompt: string, systemPrompt?: string, responseSchema?: any): Promise<string> {
  const model = 'llama-3.3-70b-versatile';
  
  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const completion = await groqClient.chat.completions.create({
    messages,
    model,
    response_format: responseSchema ? { type: 'json_object' } : undefined,
  });

  return completion.choices[0]?.message?.content || '';
}
