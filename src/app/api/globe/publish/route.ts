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
    const title = formData.get('title') as string || '';
    let slug = formData.get('slug') as string;
    const photos = formData.getAll('photos') as File[];

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }
    if (photos.length > 10) {
      return NextResponse.json({ error: 'Maksimal 10 foto' }, { status: 400 });
    }

    // Find or create user
    let dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!dbUser) {
      dbUser = await prisma.user.findUnique({ where: { email: `${clerkUserId}@clerk` } });
    }

    const isNewUser = !dbUser;

    // New users must upload at least 1 photo
    if (isNewUser && photos.length === 0) {
      return NextResponse.json({ error: 'At least one photo is required' }, { status: 400 });
    }

    if (isNewUser) {
      // New user — check slug availability
      const existingUser = await prisma.user.findUnique({ where: { slug } });
      if (existingUser) {
        return NextResponse.json({ error: 'Slug sudah dipakai' }, { status: 409 });
      }
      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: `${clerkUserId}@clerk`,
          name: title || 'My Universe',
          slug,
          package: 'free',
          maxPhotos: 10,
        },
      });
    } else {
      // Existing user — use submitted slug (they may have been created via webhook with user-xxx)
      const finalSlug = slug || dbUser.slug;
      if (finalSlug !== dbUser.slug) {
        const existingUser = await prisma.user.findUnique({ where: { slug: finalSlug } });
        if (existingUser) return NextResponse.json({ error: 'Slug sudah dipakai' }, { status: 409 });
      }
      // Update user
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { name: title || 'My Universe', slug: finalSlug, maxPhotos: 10 },
      });
      slug = finalSlug;
    }

    // Upload new photos
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
        const fileName = `photo-${Date.now()}-${i}.${ext}`;
        await fs.writeFile(path.join(localDir, fileName), buffer);
        url = `/uploads/${dbUser.id}/${fileName}`;
      } else {
        url = `/api/r2/${key}`;
      }
      const record = await prisma.photo.create({ data: { userId: dbUser.id, imageUrl: url, title: photo.name } });
      photoResults.push({ id: record.id, imageUrl: url });
    }

    return NextResponse.json({ success: true, slug, url: `/u/${slug}`, photos: photoResults });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Gagal menerbitkan globe' }, { status: 500 });
  }
}
