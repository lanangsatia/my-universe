import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const client = await clerkClient();
    const admin = await client.users.getUser(session.userId);
    if (admin.publicMetadata?.isAdmin !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: { user: { select: { id: true, name: true, slug: true, clerkId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Enrich with Clerk username
    const enrichedPayments = await Promise.all(payments.map(async (p) => {
      let clerkName: string | null = null;
      if (p.user?.clerkId) {
        try {
          const cu = await client.users.getUser(p.user.clerkId);
          clerkName = cu.username || cu.fullName || null;
        } catch {}
      }
      return {
        ...p,
        user: p.user ? { name: p.user.name, slug: p.user.slug, clerkName } : null,
      };
    }));

    return NextResponse.json({ payments: enrichedPayments });
  } catch (error) {
    console.error('Payments error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
