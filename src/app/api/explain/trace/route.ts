import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai/callAI';

const TraceSchema = z.object({
  traceExplanation: z.string()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');
    const resourceId = searchParams.get('resourceId');

    if (!pathId || !resourceId) return NextResponse.json({ error: 'Missing pathId or resourceId' }, { status: 400 });

    const pathItem = await prisma.learningPathItem.findUnique({
      where: { pathId_resourceId: { pathId, resourceId } },
      include: { resource: true }
    });

    if (!pathItem) return NextResponse.json({ error: 'Path item not found' }, { status: 404 });

    const prompt = `Trace why this resource was recommended:
Resource: "${pathItem.resource.title}"
Phase: ${pathItem.phase}, Position: ${pathItem.position}
Score Breakdown: ${JSON.stringify(pathItem.scoreBreakdown)}

Write a grounded 1-2 sentence explanation of why this was placed here for the learner.`;

    const aiRes = await callAI('writing', prompt, TraceSchema);
    if (Array.isArray(aiRes)) throw new Error('Expected object from callAI');

    return NextResponse.json({ success: true, traceExplanation: aiRes.data.traceExplanation });

  } catch (error: any) {
    console.error('Error tracing recommendation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
