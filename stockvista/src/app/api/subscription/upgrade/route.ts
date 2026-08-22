import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tier } = await req.json();

  if (!['free', 'basic', 'pro'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }

  const expiry = tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      subscriptionTier: tier,
      subscriptionExpiry: expiry,
    },
  });

  return NextResponse.json({ success: true });
}
