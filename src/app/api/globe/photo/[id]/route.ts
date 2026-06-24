import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { deleteFromR2 } from '@/lib/r2';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the photo and verify ownership
    const photo = await prisma.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Get the user to verify ownership
    const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!dbUser || photo.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from R2 if stored via proxy
    const imageUrl = photo.imageUrl;
    if (imageUrl.startsWith('/api/r2/')) {
      const key = imageUrl.replace('/api/r2/', '');
      await deleteFromR2(key);
    }

    // Delete from DB
    await prisma.photo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
