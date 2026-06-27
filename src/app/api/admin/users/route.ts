import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    const clerkUserId = session.userId;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const client = await clerkClient();
    const adminUser = await client.users.getUser(clerkUserId);
    const isAdmin = adminUser.publicMetadata?.isAdmin === true;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all DB users with photo count
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        slug: true,
        package: true,
        maxPhotos: true,
        config: true,
        createdAt: true,
        _count: { select: { photos: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get all Clerk users
    const clerkUsers = await client.users.getUserList();
    const adminClerkId = adminUser.id;

    // Build map of Clerk users keyed by ID
    const clerkMap = new Map(clerkUsers.data.map(u => [u.id, {
      email: u.emailAddresses?.[0]?.emailAddress,
      imageUrl: u.imageUrl,
      fullName: u.fullName,
      username: u.username,
      banned: u.banned,
      lastSignInAt: u.lastSignInAt,
      isAdmin: u.publicMetadata?.isAdmin === true,
    }]));

    // Build map of DB users keyed by clerkId
    const dbMap = new Map(dbUsers.filter(u => u.clerkId).map(u => [u.clerkId!, u]));

    // Merge: include all Clerk users (non-admin) + DB users without clerkId
    const seenIds = new Set<string>();
    const users: any[] = [];

    // 1. All Clerk users (excluding admins and the logged-in admin)
    for (const [clerkId, clerk] of clerkMap) {
      if (clerk.isAdmin || clerkId === adminClerkId) continue;
      seenIds.add(clerkId);
      const db = dbMap.get(clerkId);
      users.push({
        id: db?.id || `clerk-${clerkId}`,
        clerkId,
        email: clerk.email || db?.email || `${clerkId}@clerk`,
        name: db?.name || clerk.fullName || clerk.username || clerk.email?.split('@')[0] || 'User',
        slug: db?.slug || null,
        package: db?.package || 'free',
        maxPhotos: db?.maxPhotos || 5,
        photoCount: db?._count?.photos || 0,
        paymentCount: db?._count?.payments || 0,
        createdAt: db?.createdAt || null,
        isActive: !clerk.banned,
        clerkName: clerk.fullName || clerk.username || clerk.email,
        avatar: clerk.imageUrl,
        lastLogin: clerk.lastSignInAt,
      });
    }

    // 2. DB users without clerkId (legacy/fallback)
    for (const db of dbUsers) {
      if (!db.clerkId && !seenIds.has(db.id)) {
        seenIds.add(db.id);
        users.push({
          id: db.id,
          clerkId: null,
          email: db.email,
          name: db.name,
          slug: db.slug,
          package: db.package,
          maxPhotos: db.maxPhotos,
          photoCount: db._count.photos,
          paymentCount: db._count.payments,
          createdAt: db.createdAt,
          isActive: true,
          clerkName: db.name,
          avatar: null,
          lastLogin: null,
        });
      }
    }

    users.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
