import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { appConfig, integrations } from '@/lib/config';
import { createCheckoutSession, isPlan, priceIdFor } from '@/lib/providers/stripe';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!integrations.stripe()) {
    return NextResponse.json(
      { error: 'Payments are not configured on this deployment' },
      { status: 503 },
    );
  }

  let plan: unknown;
  try {
    ({ plan } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!isPlan(plan)) {
    return NextResponse.json({ error: 'Choose either the pro or premium plan' }, { status: 400 });
  }
  if (!priceIdFor(plan)) {
    return NextResponse.json(
      { error: `The ${plan} plan has no price configured` },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const checkout = await createCheckoutSession({
      plan,
      email: user.email,
      userId: user.id,
      successUrl: `${appConfig.url}/en/profile?checkout=success`,
      cancelUrl: `${appConfig.url}/en/pricing?checkout=cancelled`,
    });

    return NextResponse.json({ id: checkout.id, url: checkout.url });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: `Could not start checkout: ${reason}` }, { status: 502 });
  }
}
