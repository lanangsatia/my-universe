import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

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
