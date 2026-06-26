import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const user = await prisma.user.findUnique({
      where: { slug },
      select: {
        name: true,
        slug: true,
        config: true,
        clerkId: true,
        photos: {
          select: { id: true, imageUrl: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is banned via Clerk
    let banned = false;
    if (user.clerkId) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(user.clerkId);
        banned = clerkUser.banned;
      } catch {}
    }

    // Convert R2 public URLs to proxy URLs
    const r2PublicBase = process.env.R2_PUBLIC_URL || '';
    const photos = user.photos.map(p => ({
      id: p.id,
      imageUrl: p.imageUrl.startsWith(r2PublicBase)
        ? `/api/r2/${p.imageUrl.replace(r2PublicBase + '/', '')}`
        : p.imageUrl,
    }));

    return NextResponse.json({
      name: user.name,
      slug: user.slug,
      config: user.config || {},
      banned,
      photos,
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
