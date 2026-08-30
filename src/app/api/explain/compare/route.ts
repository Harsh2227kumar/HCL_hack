import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai/callAI';
import { aiCounterfactualSchema } from '@/lib/validation/schemas';

const COMPARE_SYSTEM_PROMPT = `You are a learning path advisor. The user wants to know why Resource A was chosen over Resource B, or how they compare.
Compare them briefly. Say something like: "Resource B would have been chosen if you had more time, but Resource A fits your current difficulty level better."
Return ONLY valid JSON matching the schema.`;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const resourceIdA = searchParams.get('resourceIdA');
    const resourceIdB = searchParams.get('resourceIdB');

    if (!userId || !resourceIdA || !resourceIdB) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const resA = await prisma.learningResource.findUnique({ where: { id: resourceIdA } });
    const resB = await prisma.learningResource.findUnique({ where: { id: resourceIdB } });

    if (!resA || !resB) {
      return NextResponse.json({ error: 'One or both resources not found' }, { status: 404 });
    }

    // In a full implementation, we'd fetch their exact hybrid score breakdown and pass it to the prompt.
    // For now, we pass the resources themselves.
    const prompt = `Resource A (Chosen): ${resA.title} (Difficulty: ${resA.difficulty}, Hours: ${resA.durationHours})
Resource B (Alternative): ${resB.title} (Difficulty: ${resB.difficulty}, Hours: ${resB.durationHours})`;

    const aiResult = await callAI('writing', prompt, aiCounterfactualSchema, COMPARE_SYSTEM_PROMPT);

    return NextResponse.json({
      comparison: aiResult.comparison,
      resourceA: resA,
      resourceB: resB
    });

  } catch (error: any) {
    console.error('[API Explain Compare]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
