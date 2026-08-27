import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function callGemini<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  // Convert Zod schema to JSON schema to pass to the model
  const jsonSchema = zodToJsonSchema(schema as any, "responseSchema");
  const schemaString = JSON.stringify(jsonSchema);

  // Instruct Gemini to return JSON that matches the schema exactly
  const fullPrompt = `${prompt}\n\nIMPORTANT: You must respond ONLY with valid JSON that strictly satisfies the following JSON schema. Do NOT include markdown blocks like \`\`\`json. Just the raw JSON object.\n\nSchema:\n${schemaString}`;

  const result = await model.generateContent(fullPrompt);
  const responseText = result.response.text().trim();
  
  // Sometimes models still wrap in markdown despite instructions, so we clean it
  const cleanedText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

  try {
    const parsedData = JSON.parse(cleanedText);
    return schema.parse(parsedData);
  } catch (error) {
    console.error('[Gemini] Failed to parse or validate JSON response:', cleanedText);
    throw new Error('Gemini response failed schema validation');
  }
}
