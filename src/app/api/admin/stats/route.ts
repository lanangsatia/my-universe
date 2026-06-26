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

    const [totalUsers, totalPhotos, totalPayments, revenueAgg, clerkUsers] = await Promise.all([
      prisma.user.count(),
      prisma.photo.count(),
      prisma.payment.count(),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      client.users.getUserList(),
    ]);

    const withGlobe = await prisma.user.count({
      where: { NOT: { slug: { startsWith: 'user-' } } },
    });
    const paidCount = await prisma.payment.count({ where: { status: 'PAID' } });

    return NextResponse.json({
      totalUsers,
      totalClerkUsers: clerkUsers.data.length,
      withGlobe,
      totalPhotos,
      totalPayments,
      paidPayments: paidCount,
      revenue: revenueAgg._sum.amount || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
