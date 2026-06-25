import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { orderId: order_id } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    await prisma.payment.update({
      where: { orderId: order_id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Simulate error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
