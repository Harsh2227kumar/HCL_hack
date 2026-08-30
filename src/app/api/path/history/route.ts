import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const history = await prisma.learningPath.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { version: 'desc' }
    });

    return NextResponse.json({ history });

  } catch (error: any) {
    console.error('[API Path History]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
