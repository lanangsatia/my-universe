import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const PACKAGES: Record<string, { price: number; maxPhotos: number }> = {
  basic: { price: 29999, maxPhotos: 10 },
  premium: { price: 49999, maxPhotos: 20 },
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Silakan login dulu' }, { status: 401 });
    }

    const body = await req.json();
    const { package: pkg } = body;

    if (!pkg || !PACKAGES[pkg as string]) {
      return NextResponse.json({ error: 'Paket tidak valid' }, { status: 400 });
    }

    const selected = PACKAGES[pkg as string];

    // Find or create user
    let dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!dbUser) {
      dbUser = await prisma.user.findUnique({ where: { email: `${clerkUserId}@clerk` } });
    }

    if (dbUser) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          package: pkg,
          maxPhotos: selected.maxPhotos,
          clerkId: dbUser.clerkId || clerkUserId,
        },
      });
    } else {
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: `${clerkUserId}@clerk`,
          name: 'User',
          slug: `user-${clerkUserId.slice(-8)}`,
          package: pkg,
          maxPhotos: selected.maxPhotos,
        },
      });
    }

    // Create a PAID payment record (bypass)
    await prisma.payment.create({
      data: {
        orderId: `BYPASS-${Date.now()}`,
        userId: dbUser.id,
        package: pkg,
        amount: selected.price,
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      package: pkg,
      maxPhotos: selected.maxPhotos,
      redirect: '/dashboard',
    });
  } catch (error) {
    console.error('Bypass payment error:', error);
    return NextResponse.json({ error: 'Gagal memproses paket' }, { status: 500 });
  }
}
