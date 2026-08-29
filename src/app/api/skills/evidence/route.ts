import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, skillName, source, score, reliability, recencyWeight } = await request.json();
    if (!userId || !skillName || !source || score == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const evidence = await prisma.skillEvidence.create({
      data: {
        userId,
        skillName,
        source,
        score,
        reliability: reliability ?? 0.5,
        recencyWeight: recencyWeight ?? 1.0
      }
    });

    return NextResponse.json({ success: true, evidence });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error adding evidence:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
