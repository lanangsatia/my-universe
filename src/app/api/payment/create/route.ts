import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSnapTransaction } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { package: pkg, amount } = body;

    if (!pkg || !amount) {
      return NextResponse.json({ error: 'Missing package or amount' }, { status: 400 });
    }

    const orderId = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create Midtrans Snap transaction
    const snap = await createSnapTransaction(amount, orderId);

    // Save payment record
    await prisma.payment.create({
      data: {
        orderId,
        package: pkg,
        amount,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      order_id: orderId,
      token: snap.token,
      redirect_url: snap.redirect_url,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
