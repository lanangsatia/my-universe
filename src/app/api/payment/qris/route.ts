import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSnapTransaction } from '@/lib/midtrans';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Silakan login dulu' }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Jumlah tidak valid' }, { status: 400 });
    }

    const orderId = `GLOBE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create Midtrans Snap transaction
    const snap = await createSnapTransaction(amount, orderId);

    // Save payment record
    await prisma.payment.create({
      data: {
        orderId,
        package: 'globe',
        amount,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      reference_id: orderId,
      token: snap.token,
      redirect_url: snap.redirect_url,
      amount,
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat pembayaran' }, { status: 500 });
  }
}
