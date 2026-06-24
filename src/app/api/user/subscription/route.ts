import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        slug: true,
        _count: { select: { photos: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ slug: null, photos: 0, maxPhotos: 10 });
    }

    return NextResponse.json({
      slug: user.slug,
      photos: user._count.photos,
      maxPhotos: 10,
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
