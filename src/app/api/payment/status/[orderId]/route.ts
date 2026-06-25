import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Default: check DB
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      select: { status: true },
    });

    if (!payment) {
      return NextResponse.json({ status: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ status: payment.status });
  } catch {
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}
