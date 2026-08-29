import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai/callAI';

const CompareSchema = z.object({
  explanation: z.string()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idA = searchParams.get('resourceIdA');
    const idB = searchParams.get('resourceIdB');

    if (!idA || !idB) return NextResponse.json({ error: 'Missing resource IDs' }, { status: 400 });

    const [resA, resB] = await Promise.all([
      prisma.learningResource.findUnique({ where: { id: idA } }),
      prisma.learningResource.findUnique({ where: { id: idB } })
    ]);

    if (!resA || !resB) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

    const prompt = `Compare these two learning resources:
Resource A: "${resA.title}" - ${resA.description}
Resource B: "${resB.title}" - ${resB.description}
Explain briefly why a learner might choose A over B, or B over A based on their differences.`;

    const aiRes = await callAI('writing', prompt, CompareSchema);
    if (Array.isArray(aiRes)) throw new Error('Expected object from callAI');

    return NextResponse.json({ success: true, explanation: aiRes.data.explanation });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error comparing resources:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
