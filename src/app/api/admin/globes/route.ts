import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const client = await clerkClient();
    const admin = await client.users.getUser(session.userId);
    if (admin.publicMetadata?.isAdmin !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const users = await prisma.user.findMany({
      where: { NOT: { slug: { startsWith: 'user-' } } },
      select: {
        id: true, name: true, slug: true, package: true, maxPhotos: true, createdAt: true,
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const globes = users.map(u => ({
      id: u.id, name: u.name, slug: u.slug, package: u.package,
      photoCount: u._count.photos, createdAt: u.createdAt,
    }));

    return NextResponse.json({ globes });
  } catch (error) {
    console.error('Globes error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
