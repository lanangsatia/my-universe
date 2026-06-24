import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { external_id, status } = body;

    if (!external_id) {
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 });
    }

    if (status === 'PAID') {
      const payment = await prisma.payment.findUnique({
        where: { orderId: external_id },
      });

      if (payment && payment.status !== 'PAID') {
        await prisma.payment.update({
          where: { orderId: external_id },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
