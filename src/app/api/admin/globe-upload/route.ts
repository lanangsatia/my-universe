import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { uploadToR2 } from '@/lib/r2';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const client = await clerkClient();
    const admin = await client.users.getUser(session.userId);
    if (admin.publicMetadata?.isAdmin !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get('photo') as File;
    const userId = formData.get('userId') as string;
    if (!file || !userId) return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `users/${userId}/admin-${Date.now()}.${ext}`;
    let url = await uploadToR2(key, buffer, file.type);
    if (!url) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const dir = path.join(process.cwd(), 'public', 'uploads', userId);
      await fs.mkdir(dir, { recursive: true });
      const name = `admin-${Date.now()}.${ext}`;
      await fs.writeFile(path.join(dir, name), buffer);
      url = `/uploads/${userId}/${name}`;
    } else {
      url = `/api/r2/${key}`;
    }

    const photo = await prisma.photo.create({
      data: { userId, imageUrl: url, title: file.name },
    });

    return NextResponse.json({ id: photo.id, url: photo.imageUrl });
  } catch (error) {
    console.error('Admin globe upload error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
