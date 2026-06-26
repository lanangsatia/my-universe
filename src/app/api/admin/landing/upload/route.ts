import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { uploadToR2 } from '@/lib/r2';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const client = await clerkClient();
    const admin = await client.users.getUser(session.userId);
    if (admin.publicMetadata?.isAdmin !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get('photo') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `landing/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    let url = await uploadToR2(key, buffer, file.type);

    if (!url) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const dir = path.join(process.cwd(), 'public', 'uploads', 'landing');
      await fs.mkdir(dir, { recursive: true });
      const name = `${Date.now()}.${ext}`;
      await fs.writeFile(path.join(dir, name), buffer);
      url = `/uploads/landing/${name}`;
    } else {
      url = `/api/r2/${key}`;
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Admin landing upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
