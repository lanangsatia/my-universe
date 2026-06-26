import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({ select: { config: true }, take: 20 });
    for (const u of users) {
      const cfg = u.config as any;
      if (cfg?.landingDefaults) return NextResponse.json(cfg.landingDefaults);
    }
    return NextResponse.json({ greetingText: '', questionText: '', photoUrls: [] });
  } catch {
    return NextResponse.json({ greetingText: '', questionText: '', photoUrls: [] });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const client = await clerkClient();
    const admin = await client.users.getUser(session.userId);
    if (admin.publicMetadata?.isAdmin !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    let dbUser = await prisma.user.findUnique({ where: { clerkId: session.userId } });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: session.userId,
          email: `${session.userId}@clerk`,
          name: 'Admin', slug: `admin-${Date.now()}`,
          package: 'free', maxPhotos: 10, config: {},
        },
      });
    }
    const existingConfig = (dbUser.config as any) || {};
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { config: { ...existingConfig, landingDefaults: body } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Landing error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
