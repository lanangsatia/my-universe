import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        slug: true,
        _count: { select: { photos: true } },
      },
    });

    // Auto-create user if they don't exist yet (fallback if webhook missed)
    if (!user) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || `${clerkUserId}@clerk`;
      const name = clerkUser.fullName || clerkUser.username || email.split('@')[0];
      const slug = `user-${clerkUserId.slice(-8)}`;

      const created = await prisma.user.create({
        data: { clerkId: clerkUserId, email, name, slug, package: 'free', maxPhotos: 5 },
      });

      return NextResponse.json({
        slug: created.slug,
        photos: 0,
        maxPhotos: created.maxPhotos,
      });
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
