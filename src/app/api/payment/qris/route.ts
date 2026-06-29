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

    // Find user to link payment
    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Check if there's already a PENDING payment for this user
    const existingPayment = await prisma.payment.findFirst({
      where: { userId: user.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPayment) {
      // Generate a new orderId since the old one was already registered with Midtrans
      const newOrderId = `GLOBE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Update the existing payment record with the new orderId
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { orderId: newOrderId },
      });

      // Create a fresh Snap transaction with the new orderId
      const snap = await createSnapTransaction(existingPayment.amount, newOrderId);
      return NextResponse.json({
        reference_id: newOrderId,
        token: snap.token,
        redirect_url: snap.redirect_url,
        amount: existingPayment.amount,
        existing: true,
      });
    }

    const orderId = `GLOBE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create Midtrans Snap transaction
    const snap = await createSnapTransaction(amount, orderId);

    // Save payment record with user reference
    await prisma.payment.create({
      data: {
        orderId,
        package: 'globe',
        amount,
        status: 'PENDING',
        userId: user.id,
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
