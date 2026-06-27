import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { config } = body;

    if (!config) return NextResponse.json({ error: 'Config required' }, { status: 400 });

    let dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!dbUser) {
      dbUser = await prisma.user.findUnique({ where: { email: `${clerkUserId}@clerk` } });
    }
    if (!dbUser) {
      // Auto-create user if they don't exist yet (pre-publish config save)
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || `${clerkUserId}@clerk`;
      const name = clerkUser.fullName || clerkUser.username || email.split('@')[0];
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUserId, email, name,
          slug: `user-${clerkUserId.slice(-8)}`,
          package: 'free', maxPhotos: 5, config,
        },
      });
      return NextResponse.json({ success: true });
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { config },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { config: true, name: true, slug: true },
    });

    return NextResponse.json(user?.config || {});
  } catch (error) {
    console.error('Load settings error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
