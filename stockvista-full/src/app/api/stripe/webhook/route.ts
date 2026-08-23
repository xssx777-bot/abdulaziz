import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { integrations } from '@/lib/config';
import { isPlan, tierForSubscription, verifyWebhook } from '@/lib/providers/stripe';

// The raw body is required to verify the signature, so this must not be
// parsed or cached by the framework.
export const dynamic = 'force-dynamic';

async function applySubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const plan = subscription.metadata?.plan;
  if (!userId || !isPlan(plan)) return;

  const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tierForSubscription(subscription.status, plan),
      subscriptionExpiry: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

export async function POST(req: Request) {
  if (!integrations.stripe() || !integrations.stripeWebhook()) {
    return NextResponse.json({ error: 'Webhooks are not configured' }, { status: 503 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = verifyWebhook(payload, req.headers.get('stripe-signature'));
  } catch (error) {
    // A bad signature is the expected shape of an attack, not a server fault:
    // answer 400 and do nothing else.
    const reason = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: `Signature verification failed: ${reason}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkout = event.data.object as Stripe.Checkout.Session;
        const userId = checkout.client_reference_id ?? checkout.metadata?.userId;
        const plan = checkout.metadata?.plan;
        if (userId && isPlan(plan)) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionTier: plan },
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await applySubscription(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionTier: 'free', subscriptionExpiry: null },
          });
        }
        break;
      }

      default:
        // Stripe retries anything that is not acknowledged, so unhandled event
        // types are accepted rather than rejected.
        break;
    }
  } catch (error) {
    // Answer 500 so Stripe retries: the signature was valid, the work was not
    // completed, and dropping it would silently lose a paid upgrade.
    const reason = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: `Could not apply event: ${reason}` }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
