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
    const { id, email_addresses, first_name, last_name, username } = evt.data;
    const email = email_addresses?.[0]?.email_address || `${id}@clerk`;
    const name = [first_name, last_name].filter(Boolean).join(' ') || username || email.split('@')[0];
    const slug = `user-${id.slice(-8)}`; // Clear marker: this user hasn't published yet

    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email,
          name,
          slug,
          package: 'free',
          maxPhotos: 5,
        },
      });
      console.log(`✅ User created via webhook: ${id} (${email})`);
    } catch (err: any) {
      if (err.code === 'P2002') {
        console.log(`⚠️ User ${id} already exists in DB`);
      } else {
        console.error('❌ Webhook user.created error:', err);
      }
    }
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
