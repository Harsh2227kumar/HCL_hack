import Groq from 'groq-sdk';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function callGroq<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing');
  }

  // Convert Zod schema to JSON schema
  const jsonSchema = zodToJsonSchema(schema as any, "responseSchema");
  const schemaString = JSON.stringify(jsonSchema);

  const fullPrompt = `${prompt}\n\nIMPORTANT: You must respond ONLY with valid JSON that strictly satisfies the following JSON schema. Do NOT include markdown blocks like \`\`\`json. Just the raw JSON object.\n\nSchema:\n${schemaString}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an AI assistant that only outputs strictly formatted JSON. Never output conversational text outside the JSON object.',
      },
      {
        role: 'user',
        content: fullPrompt,
      },
    ],
    model: 'llama-3.3-70b-versatile', // using the latest Llama 3 model on Groq
    response_format: { type: 'json_object' },
    temperature: 0.1, // low temp for deterministic JSON
  });

  const responseText = completion.choices[0]?.message?.content || '';

  try {
    const parsedData = JSON.parse(responseText);
    return schema.parse(parsedData);
  } catch (error) {
    console.error('[Groq] Failed to parse or validate JSON response:', responseText);
    throw new Error('Groq response failed schema validation');
  }
}
