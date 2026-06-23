import { NextRequest, NextResponse } from 'next/server';
import { createPaymentInvoice } from '@/lib/xendit';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { package: pkg, amount } = body;

    if (!pkg || !amount) {
      return NextResponse.json({ error: 'Missing package or amount' }, { status: 400 });
    }

    // Create payment record
    const invoice = await createPaymentInvoice({
      package: pkg,
      amount,
    });

    // Save payment to database
    await prisma.payment.create({
      data: {
        orderId: invoice.order_id,
        package: pkg,
        amount,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      order_id: invoice.order_id,
      invoice_url: invoice.invoice_url,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
