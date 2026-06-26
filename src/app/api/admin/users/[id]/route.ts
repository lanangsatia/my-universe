import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { deleteFromR2 } from '@/lib/r2';

async function checkAdmin() {
  const session = await auth();
  if (!session.userId) return null;
  const client = await clerkClient();
  const adminUser = await client.users.getUser(session.userId);
  return adminUser.publicMetadata?.isAdmin === true ? client : null;
}

// GET — fetch user's globe data
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cl = await checkAdmin();
    if (!cl) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, config: true,
        photos: { select: { id: true, imageUrl: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      name: user.name, slug: user.slug,
      config: user.config || {},
      photos: user.photos.map(p => ({ id: p.id, url: p.imageUrl })),
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PUT — update user's globe config
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cl = await checkAdmin();
    if (!cl) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { config, slug } = body;

    const updateData: any = {};
    if (config !== undefined) updateData.config = config;
    if (slug !== undefined) {
      // Check uniqueness
      const existing = await prisma.user.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Slug sudah dipakai user lain' }, { status: 409 });
      }
      updateData.slug = slug;
    }

    await prisma.user.update({ where: { id }, data: updateData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH — ban/unban user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = await checkAdmin();
    if (!client) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // 'ban' | 'unban'

    // Get user from DB to find clerkId
    const dbUser = await prisma.user.findUnique({ where: { id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cegah ban/unban admin
    if (dbUser.clerkId) {
      const targetClerk = await client.users.getUser(dbUser.clerkId);
      if (targetClerk.publicMetadata?.isAdmin === true) {
        return NextResponse.json({ error: 'Tidak bisa memodifikasi admin' }, { status: 403 });
      }
      if (action === 'ban') {
        await client.users.banUser(dbUser.clerkId);
      } else if (action === 'unban') {
        await client.users.unbanUser(dbUser.clerkId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE — delete user and all data
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = await checkAdmin();
    if (!client) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const dbUser = await prisma.user.findUnique({ where: { id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cegah hapus admin
    if (dbUser.clerkId) {
      try {
        const targetClerk = await client.users.getUser(dbUser.clerkId);
        if (targetClerk.publicMetadata?.isAdmin === true) {
          return NextResponse.json({ error: 'Tidak bisa menghapus admin' }, { status: 403 });
        }
      } catch {}
    }

    // Delete photos from R2
    const photos = await prisma.photo.findMany({ where: { userId: id } });
    for (const photo of photos) {
      if (photo.imageUrl.startsWith('/api/r2/')) {
        const key = photo.imageUrl.replace('/api/r2/', '');
        await deleteFromR2(key);
      }
    }

    // Delete from DB (cascade)
    await prisma.photo.deleteMany({ where: { userId: id } });
    await prisma.payment.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    // Delete from Clerk
    if (dbUser.clerkId) {
      try { await client.users.deleteUser(dbUser.clerkId); } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
