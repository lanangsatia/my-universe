import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Verification failed', { status: 400 });
  }

  const { type } = evt;

  if (type === 'user.created') {
    // Don't create DB users here — users are created naturally
    // when they go through the publish/payment flow on dashboard.
    // They still appear in admin via the Clerk-only user merge.
    const { id } = evt.data;
    console.log(`👤 User registered: ${id} (no DB record yet)`);
  }

  if (type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: { email: email_addresses?.[0]?.email_address, name: [first_name, last_name].filter(Boolean).join(' ') },
      });
    } catch {
      console.log(`⚠️ User ${id} not found in DB for update`);
    }
  }

  if (type === 'user.deleted') {
    const { id } = evt.data;
    try {
      await prisma.user.delete({ where: { clerkId: id } });
    } catch {
      console.log(`⚠️ User ${id} not found in DB for deletion`);
    }
  }

  return new Response('OK', { status: 200 });
}
