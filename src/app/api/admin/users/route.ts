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

    // Get Clerk user info
    const clerkUsers = await client.users.getUserList();
    const clerkMap = new Map(clerkUsers.data.map(u => [u.id, {
      email: u.emailAddresses?.[0]?.emailAddress,
      imageUrl: u.imageUrl,
      fullName: u.fullName,
      username: u.username,
      banned: u.banned,
      lastSignInAt: u.lastSignInAt,
      isAdmin: u.publicMetadata?.isAdmin === true,
    }]));

    // Get admin's own clerkId to exclude from list
    const adminClerkId = adminUser.id;

    const users = dbUsers
      .filter(u => u.clerkId !== adminClerkId) // Jangan tampilkan admin
      .map(u => {
        const clerk = u.clerkId ? clerkMap.get(u.clerkId) : null;
        // Juga filter admin dari clerkMap
        if (clerk?.isAdmin) return null;
        return {
          id: u.id,
          clerkId: u.clerkId,
          email: u.email,
          name: u.name,
          slug: u.slug,
          package: u.package,
          maxPhotos: u.maxPhotos,
          photoCount: u._count.photos,
          paymentCount: u._count.payments,
          createdAt: u.createdAt,
          isActive: !clerk?.banned,
          clerkName: clerk?.fullName || clerk?.username || clerk?.email,
          avatar: clerk?.imageUrl,
          lastLogin: clerk?.lastSignInAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
