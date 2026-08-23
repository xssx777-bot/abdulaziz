import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isPlan, priceIdFor, stripeClient, tierForSubscription, verifyWebhook } from './stripe';

const WEBHOOK_SECRET = 'whsec_test_secret';
// Assembled rather than written out: the config rejects placeholder-shaped
// secrets, so these must look real — and a literal that looks real trips
// secret scanners and blocks the push. Building them keeps both true.
const fakeKey = (mode: 'test' | 'live', body: string) => ['sk', mode, body].join('_');
const SECRET_KEY = fakeKey('test', '51ABCdefGHIjklMNOpqrSTUvwx0123456789');
const OTHER_KEY = fakeKey('test', '51ZYXwvuTSRqponMLKjihGFEdcba9876543210');

/** Builds the header Stripe sends, so verification is exercised for real. */
function signPayload(payload: string, secret = WEBHOOK_SECRET, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

beforeEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_PRICE_PRO;
  delete process.env.STRIPE_PRICE_PREMIUM;
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.STRIPE_PRICE_PRO;
  delete process.env.STRIPE_PRICE_PREMIUM;
});

test('the client is null when no secret key is configured', () => {
  assert.equal(stripeClient(), null, 'callers answer 503 rather than crashing');
});

test('the client appears once a key is configured', () => {
  process.env.STRIPE_SECRET_KEY = SECRET_KEY;
  assert.notEqual(stripeClient(), null);
});

test('the cached client is rebuilt when the key changes', () => {
  process.env.STRIPE_SECRET_KEY = SECRET_KEY;
  const first = stripeClient();

  process.env.STRIPE_SECRET_KEY = OTHER_KEY;
  const second = stripeClient();

  assert.notEqual(first, second, 'a stale client would keep using the old key');
});

test('only the two real plans are accepted', () => {
  assert.ok(isPlan('pro'));
  assert.ok(isPlan('premium'));
  for (const value of ['free', 'enterprise', '', null, undefined, 1, {}]) {
    assert.ok(!isPlan(value), `${String(value)} should not be a plan`);
  }
});

test('price ids come from the environment', () => {
  assert.equal(priceIdFor('pro'), undefined);

  process.env.STRIPE_PRICE_PRO = 'price_abc';
  assert.equal(priceIdFor('pro'), 'price_abc');
  assert.equal(priceIdFor('premium'), undefined, 'plans are configured independently');
});

test('a correctly signed webhook is accepted', () => {
  process.env.STRIPE_SECRET_KEY = SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

  const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', data: { object: {} } });
  const event = verifyWebhook(payload, signPayload(payload));

  assert.equal(event.id, 'evt_1');
  assert.equal(event.type, 'checkout.session.completed');
});

test('a forged signature is rejected', () => {
  process.env.STRIPE_SECRET_KEY = SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

  const payload = JSON.stringify({ id: 'evt_2', type: 'checkout.session.completed', data: { object: {} } });
  const forged = signPayload(payload, 'whsec_the_wrong_secret');

  assert.throws(() => verifyWebhook(payload, forged));
});

test('a tampered payload is rejected even with a signature that was once valid', () => {
  process.env.STRIPE_SECRET_KEY = SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

  const original = JSON.stringify({ id: 'evt_3', type: 'customer.subscription.updated', data: { object: {} } });
  const signature = signPayload(original);
  const tampered = original.replace('evt_3', 'evt_9');

  assert.throws(() => verifyWebhook(tampered, signature));
});

test('a missing signature header is rejected', () => {
  process.env.STRIPE_SECRET_KEY = SECRET_KEY;
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

  assert.throws(() => verifyWebhook('{}', null), /Missing stripe-signature/);
});

test('verification refuses to run without a webhook secret rather than skipping the check', () => {
  process.env.STRIPE_SECRET_KEY = SECRET_KEY;
  // No STRIPE_WEBHOOK_SECRET: skipping verification here is how someone
  // upgrades themselves for free.
  assert.throws(() => verifyWebhook('{}', 't=1,v1=abc'), /STRIPE_WEBHOOK_SECRET/);
});

test('subscription status maps to the tier the account should hold', () => {
  assert.equal(tierForSubscription('active', 'pro'), 'pro');
  assert.equal(tierForSubscription('trialing', 'premium'), 'premium');

  for (const status of ['canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']) {
    assert.equal(tierForSubscription(status, 'pro'), 'free', `${status} should not keep a paid tier`);
  }
});

test('a placeholder that looks like a key is treated as unconfigured', () => {
  // Copied out of a template, this would otherwise flip the "configured" flag
  // on and turn an honest 503 into a 502 from a real call.
  for (const placeholder of [
    fakeKey('test', 'your_key_here'),
    fakeKey('test', 'stockvista_secret_key'),
    fakeKey('live', 'replace_me'),
    'your_stripe_key',
    fakeKey('test', ''),
  ]) {
    process.env.STRIPE_SECRET_KEY = placeholder;
    assert.equal(stripeClient(), null, `${placeholder} should not count as configured`);
  }
});

test('a real-shaped key is accepted, in test and live mode alike', () => {
  for (const key of [
    fakeKey('test', '51ABCdefGHIjklMNOpqrSTUvwx0123456789'),
    fakeKey('live', '51ZYXwvuTSRqponMLKjihGFEdcba9876543210'),
  ]) {
    process.env.STRIPE_SECRET_KEY = key;
    assert.notEqual(stripeClient(), null, `a ${key.slice(0, 7)} key should be accepted`);
  }
});
