import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai/callAI';

const TraceSchema = z.object({
  traceExplanation: z.string().default('Recommended based on prerequisite hierarchy and track alignment.')
});

async function explainTrace(pathId: string | null, resourceId: string) {
  if (!resourceId) {
    return NextResponse.json({ error: 'Missing resourceId' }, { status: 400 });
  }

  let pathItem = null;

  if (pathId) {
    pathItem = await prisma.learningPathItem.findUnique({
      where: { pathId_resourceId: { pathId, resourceId } },
      include: { resource: true }
    });
  } else {
    pathItem = await prisma.learningPathItem.findFirst({
      where: { resourceId },
      orderBy: { path: { generatedAt: 'desc' } },
      include: { resource: true }
    });
  }

  if (!pathItem) {
    return NextResponse.json({ error: 'Path item not found' }, { status: 404 });
  }

  const prompt = `Trace why this resource was recommended:
Resource: "${pathItem.resource.title}"
Phase: ${pathItem.phase}, Position: ${pathItem.position}
Score Breakdown: ${JSON.stringify(pathItem.scoreBreakdown)}

Write a grounded 1-2 sentence explanation of why this was placed here for the learner.`;

  const aiRes = await callAI('writing', prompt, TraceSchema);
  if (Array.isArray(aiRes)) throw new Error('Expected object from callAI');

  // Also include score breakdown and reasoning trace in response for DecisionTraceModal consistency
  return NextResponse.json({
    success: true,
    traceExplanation: aiRes.data.traceExplanation,
    resourceId: pathItem.resourceId,
    score: pathItem.score,
    scoreBreakdown: pathItem.scoreBreakdown,
    reason: pathItem.reason
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Missing resourceId' }, { status: 400 });
    }

    return await explainTrace(pathId, resourceId);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error tracing recommendation (GET):', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pathId, resourceId } = body;

    if (!resourceId) {
      return NextResponse.json({ error: 'Missing resourceId' }, { status: 400 });
    }

    return await explainTrace(pathId || null, resourceId);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error tracing recommendation (POST):', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
