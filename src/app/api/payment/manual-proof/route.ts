import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Silakan login dulu' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const formData = await req.formData();
    const orderId = formData.get('order_id') as string;
    const proofFile = formData.get('proof') as File;

    if (!orderId || !proofFile) {
      return NextResponse.json({ error: 'Missing order_id or proof' }, { status: 400 });
    }

    // Verify payment exists and belongs to user
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment tidak ditemukan' }, { status: 404 });
    }
    if (payment.userId && payment.userId !== user.id) {
      return NextResponse.json({ error: 'Payment bukan milik Anda' }, { status: 403 });
    }

    // Upload proof to R2
    const bytes = await proofFile.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(bytes));
    const ext = proofFile.name.split('.').pop() || 'jpg';
    const key = `payment-proofs/${orderId}-${Date.now()}.${ext}`;

    let publicUrl: string | null;
    try {
      publicUrl = await uploadToR2(key, buffer, proofFile.type);
    } catch (uploadErr: any) {
      console.error('R2 upload error:', uploadErr);
      return NextResponse.json({ error: 'Gagal upload ke penyimpanan: ' + (uploadErr?.message || 'unknown') }, { status: 500 });
    }

    if (!publicUrl) {
      return NextResponse.json({ error: 'Gagal upload bukti pembayaran. Cek konfigurasi R2.' }, { status: 500 });
    }

    // Update payment status and store proof URL
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: 'MANUAL_PENDING',
        proofUrl: publicUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bukti pembayaran diterima. Kami akan verifikasi segera.',
    });
  } catch (error: any) {
    console.error('Manual proof error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Gagal mengirim bukti pembayaran' }, { status: 500 });
  }
}
