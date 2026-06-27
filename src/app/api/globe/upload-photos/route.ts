import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { uploadToR2, r2UrlToProxy } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const photos = formData.getAll('photos') as File[];
    const title = formData.get('title') as string || '';

    if (photos.length === 0) {
      return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
    }
    if (photos.length > 10) {
      return NextResponse.json({ error: 'Maksimal 10 foto' }, { status: 400 });
    }

    // Find or create user (for linking photos)
    let dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!dbUser) {
      dbUser = await prisma.user.findUnique({ where: { email: `${clerkUserId}@clerk` } });
    }
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found. Save settings first.' }, { status: 404 });
    }

    // Upload photos to R2 and save to DB
    interface PhotoResult { id: string; imageUrl: string; }
    const photoResults: PhotoResult[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const buffer = Buffer.from(await photo.arrayBuffer());
      const ext = photo.name.split('.').pop() || 'jpg';
      const key = `users/${dbUser.id}/photo-${Date.now()}-${i}.${ext}`;

      let url = await uploadToR2(key, buffer, photo.type);
      if (!url) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const localDir = path.join(process.cwd(), 'public', 'uploads', dbUser.id);
        await fs.mkdir(localDir, { recursive: true });
        const localPath = path.join(localDir, `${Date.now()}-${i}.${ext}`);
        await fs.writeFile(localPath, buffer);
        url = `/uploads/${dbUser.id}/${path.basename(localPath)}`;
      }

      const created = await prisma.photo.create({
        data: { userId: dbUser.id, imageUrl: r2UrlToProxy(url) },
      });
      photoResults.push({ id: created.id, imageUrl: created.imageUrl });
    }

    return NextResponse.json({ photos: photoResults });
  } catch (error) {
    console.error('Upload photos error:', error);
    return NextResponse.json({ error: 'Failed to upload photos' }, { status: 500 });
  }
}
