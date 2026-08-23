import Stripe from 'stripe';
import { stripeConfig } from '@/lib/config';

export type Plan = 'pro' | 'premium';

export const isPlan = (value: unknown): value is Plan => value === 'pro' || value === 'premium';

let cached: { key: string; client: Stripe } | null = null;

/** Null when no secret key is configured, so callers can answer 503 rather than crash. */
export function stripeClient(): Stripe | null {
  const key = stripeConfig.secretKey;
  if (!key) return null;

  // Keyed on the secret: caching the client alone would keep serving a stale
  // one after the key changes.
  if (cached?.key !== key) {
    cached = { key, client: new Stripe(key, { apiVersion: '2023-10-16' }) };
  }
  return cached.client;
}

export function priceIdFor(plan: Plan): string | undefined {
  return stripeConfig.prices[plan];
}

export interface CheckoutRequest {
  plan: Plan;
  email: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(request: CheckoutRequest) {
  const stripe = stripeClient();
  if (!stripe) throw new Error('Stripe is not configured');

  const price = priceIdFor(request.plan);
  if (!price) throw new Error(`No price configured for the ${request.plan} plan`);

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    customer_email: request.email,
    // Carried back on the webhook, so the subscription can be matched to a user
    // without trusting anything the browser sends.
    client_reference_id: request.userId,
    metadata: { userId: request.userId, plan: request.plan },
    subscription_data: { metadata: { userId: request.userId, plan: request.plan } },
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
  });
}

/**
 * Verifies the signature and returns the event.
 *
 * Signature verification is the whole point of this function: without it anyone
 * who learns the endpoint can POST a forged "payment succeeded" and upgrade
 * themselves. It throws when the secret is missing rather than skipping the
 * check.
 */
export function verifyWebhook(payload: string, signature: string | null): Stripe.Event {
  const stripe = stripeClient();
  if (!stripe) throw new Error('Stripe is not configured');
  if (!stripeConfig.webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  if (!signature) throw new Error('Missing stripe-signature header');

  return stripe.webhooks.constructEvent(payload, signature, stripeConfig.webhookSecret);
}

/** Maps a Stripe subscription status to the tier the account should hold. */
export function tierForSubscription(status: string, plan: Plan): string {
  const active = status === 'active' || status === 'trialing';
  return active ? plan : 'free';
}
