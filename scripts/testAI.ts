import { z } from 'zod';
import { callAI } from '../src/lib/ai/callAI';
import { config } from 'dotenv';
import * as fs from 'fs';

// Falls back to .env if .env.local doesn't exist
if (fs.existsSync('.env.local')) {
  config({ path: '.env.local' });
} else {
  config({ path: '.env' });
}

const TestSchema = z.object({
  extractedName: z.string().describe("The person's name"),
  extractedAge: z.number().describe("The person's age"),
  confidence: z.number().describe("Confidence score between 0 and 1"),
});

async function runTest() {
  console.log("=== Testing 'understanding' role (Primary: Gemini, Fallback: Groq) ===");
  try {
    const result1 = await callAI('understanding', "Extract details from this text: My name is Yash and I just turned 24 years old today.", TestSchema);
    console.log("Result 1:", result1);
  } catch (e: any) {
    console.error("Test 1 failed:", e.message);
  }

  console.log("\n=== Testing 'writing' role (Primary: Groq, Fallback: Gemini) ===");
  try {
    const result2 = await callAI('writing', "Extract details from this text: Sameera is a 22-year-old developer.", TestSchema);
    console.log("Result 2:", result2);
  } catch (e: any) {
    console.error("Test 2 failed:", e.message);
  }
}

runTest();
