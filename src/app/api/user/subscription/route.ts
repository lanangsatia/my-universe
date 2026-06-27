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
        id: true,
        slug: true,
        _count: { select: { photos: true } },
      },
    });

    // If user hasn't published yet, return null slug
    if (!user) {
      return NextResponse.json({ slug: null, photos: 0, maxPhotos: 10, pendingPayment: false });
    }

    // Check for pending payment
    const pendingPayment = await prisma.payment.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });

    // If slug is auto-generated (user-xxx), treat as not yet published
    const hasGlobe = user.slug && !user.slug.startsWith('user-');

    return NextResponse.json({
      slug: hasGlobe ? user.slug : null,
      photos: user._count.photos,
      maxPhotos: 10,
      pendingPayment: !!pendingPayment,
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
