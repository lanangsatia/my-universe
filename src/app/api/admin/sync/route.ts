import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    if (!session.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const client = await clerkClient();
    const admin = await client.users.getUser(session.userId);
    if (admin.publicMetadata?.isAdmin !== true) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const clerkUsers = await client.users.getUserList();
    let created = 0, updated = 0;

    for (const cu of clerkUsers.data) {
      const email = cu.emailAddresses?.[0]?.emailAddress || `${cu.id}@clerk`;
      const name = cu.fullName || cu.username || email;

      const existing = await prisma.user.findFirst({
        where: { OR: [{ clerkId: cu.id }, { email }] },
      });

      if (existing) {
        if (!existing.clerkId) {
          await prisma.user.update({ where: { id: existing.id }, data: { clerkId: cu.id } });
          updated++;
        }
      } else {
        await prisma.user.create({
          data: {
            clerkId: cu.id, email, name: name || 'User',
            slug: `user-${cu.id.slice(-8)}`, package: 'free', maxPhotos: 5,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ created, updated, total: clerkUsers.data.length });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
