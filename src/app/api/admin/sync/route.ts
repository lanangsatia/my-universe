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

      const existing = await prisma.user.findFirst({
        where: { OR: [{ clerkId: cu.id }, { email }] },
      });

      if (existing) {
        // Only update clerkId if missing — don't create fake globe entries
        if (!existing.clerkId) {
          await prisma.user.update({ where: { id: existing.id }, data: { clerkId: cu.id } });
          updated++;
        }
      }
      // Don't create new users here — users are created naturally
      // when they go through the publish/payment flow
    }

    return NextResponse.json({ created, updated, total: clerkUsers.data.length });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
