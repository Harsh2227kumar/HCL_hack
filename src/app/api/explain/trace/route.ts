import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai/callAI';

const TraceSchema = z.object({
  traceExplanation: z.string().default('Recommended based on prerequisite hierarchy and track alignment.')
});

async function explainTrace(pathId: string | null | undefined, userId: string | null | undefined, resourceId: string) {
  if (!resourceId) {
    return NextResponse.json({ error: 'Missing required resourceId parameter' }, { status: 400 });
  }

  if (!pathId && !userId) {
    return NextResponse.json(
      { error: 'Scoping error: either pathId or userId must be provided alongside resourceId.' },
      { status: 400 }
    );
  }

  let resolvedPathId = pathId;

  // If pathId is not provided, resolve the latest LearningPath for the user
  if (!resolvedPathId && userId) {
    const latestPath = await prisma.learningPath.findFirst({
      where: { userId },
      orderBy: { version: 'desc' },
      select: { id: true }
    });

    if (!latestPath) {
      return NextResponse.json({ error: 'No learning path found for the specified user.' }, { status: 404 });
    }

    resolvedPathId = latestPath.id;
  }

  const pathItem = await prisma.learningPathItem.findUnique({
    where: {
      pathId_resourceId: {
        pathId: resolvedPathId!,
        resourceId,
      },
    },
    include: { resource: true },
  });

  if (!pathItem) {
    return NextResponse.json({ error: 'Path item not found in the specified learning path.' }, { status: 404 });
  }

  const prompt = `Trace why this resource was recommended:
Resource: "${pathItem.resource.title}"
Phase: ${pathItem.phase}, Position: ${pathItem.position}
Score Breakdown: ${JSON.stringify(pathItem.scoreBreakdown)}

Write a grounded 1-2 sentence explanation of why this was placed here for the learner.`;

  let traceExplanation = pathItem.reason || 'Recommended based on prerequisite hierarchy and track alignment.';
  try {
    const aiRes = await callAI('writing', prompt, TraceSchema);
    if (!Array.isArray(aiRes) && aiRes?.data?.traceExplanation) {
      traceExplanation = aiRes.data.traceExplanation;
    }
  } catch {
    console.warn('[explain/trace] Fallback explanation used.');
  }

  return NextResponse.json({
    success: true,
    traceExplanation,
    resourceId: pathItem.resourceId,
    pathId: pathItem.pathId,
    score: pathItem.score,
    scoreBreakdown: pathItem.scoreBreakdown,
    reason: pathItem.reason
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');
    const userId = searchParams.get('userId');
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Missing required resourceId parameter' }, { status: 400 });
    }

    if (!pathId && !userId) {
      return NextResponse.json(
        { error: 'Scoping error: either pathId or userId must be provided alongside resourceId.' },
        { status: 400 }
      );
    }

    return await explainTrace(pathId, userId, resourceId);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error tracing recommendation (GET):', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pathId, userId, resourceId } = body;

    if (!resourceId) {
      return NextResponse.json({ error: 'Missing required resourceId parameter' }, { status: 400 });
    }

    if (!pathId && !userId) {
      return NextResponse.json(
        { error: 'Scoping error: either pathId or userId must be provided alongside resourceId.' },
        { status: 400 }
      );
    }

    return await explainTrace(pathId || null, userId || null, resourceId);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error tracing recommendation (POST):', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
