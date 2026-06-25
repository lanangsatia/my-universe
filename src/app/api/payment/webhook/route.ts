import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkTransactionStatus } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Support Midtrans notification + existing callbacks
    const orderId = body.order_id || body.external_id || body.reference_id;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    // Check if already PAID
    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing?.status === 'PAID') {
      return NextResponse.json({ received: true });
    }

    // For Midtrans: check transaction status
    if (body.transaction_status || body.order_id) {
      const status = await checkTransactionStatus(orderId);
      if (status.status === 'settlement' || status.status === 'capture') {
        await prisma.payment.update({
          where: { orderId },
          data: { status: 'PAID', paidAt: new Date() },
        });
        console.log(`Payment ${orderId} marked as PAID via Midtrans`);
      }
      return NextResponse.json({ received: true });
    }

    // Legacy callbacks
    const isPaid = body.status === 'PAID' || body.status === 'COMPLETED';
    if (isPaid && existing) {
      await prisma.payment.update({
        where: { orderId },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
