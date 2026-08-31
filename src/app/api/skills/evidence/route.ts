import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evidenceSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = evidenceSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { userId, skillName } = parsed.data;

    const evidence = await prisma.skillEvidence.findMany({
      where: { userId, skillName },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({ evidence });

  } catch (error: any) {
    console.error('[API Skills Evidence]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
