import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    const paths = await prisma.learningPath.findMany({
      where: { userId },
      orderBy: { version: 'asc' },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      paths,
    });
  } catch (error) {
    console.error('Error in /api/path/history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning path history' },
      { status: 500 }
    );
  }
}
