/**
 * Reports which integrations are configured, and whether their credentials
 * actually work.
 *
 * Run after putting a key in .env.local:
 *
 *   npm run check:integrations
 *
 * Configuration alone proves nothing — a typo, an expired key or an exhausted
 * quota all look identical to a key that is simply absent, because the app is
 * built to degrade quietly rather than crash. So each configured integration is
 * called for real. Secrets are never printed, only their last four characters.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Stripe from 'stripe';

// Load .env.local the way Next does at runtime, since this runs outside Next.
for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(join(process.cwd(), file), 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue; // an earlier file wins
      process.env[key] = rawValue.trim().replace(/^["\']|["\']$/g, '');
    }
  } catch {
    // Absent file: nothing to load.
  }
}

const { marketDataConfig, ibkrConfig, stripeConfig, integrations } = await import('../src/lib/config');

const ESC = String.fromCharCode(27);
const colour = (code: number, text: string) => `${ESC}[${code}m${text}${ESC}[0m`;
const PASS = colour(32, '\u2714');
const FAIL = colour(31, '\u2718');
const SKIP = colour(90, '\u2013');

let failures = 0;

const masked = (secret: string) => `\u2022\u2022\u2022\u2022${secret.slice(-4)}`;

function report(name: string, state: 'ok' | 'failed' | 'not configured', detail: string) {
  const mark = state === 'ok' ? PASS : state === 'failed' ? FAIL : SKIP;
  console.log(`${mark} ${name.padEnd(22)} ${detail}`);
  if (state === 'failed') failures += 1;
}

const stripeFor = (secret: string) => new Stripe(secret, { apiVersion: '2023-10-16' });

async function checkMarketData() {
  if (!integrations.marketData()) {
    report('Market data', 'not configured', 'MARKET_DATA_API_KEY unset \u2014 serving sample quotes');
    return;
  }

  const key = marketDataConfig.apiKey!;
  const url = new URL('/quote', marketDataConfig.baseUrl);
  url.searchParams.set('symbol', 'AAPL');
  url.searchParams.set('apikey', key);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      report('Market data', 'failed', `${masked(key)} \u2014 HTTP ${response.status}`);
      return;
    }
    // The vendor reports key and quota problems in a 200 body.
    if (body?.status === 'error') {
      report('Market data', 'failed', `${masked(key)} \u2014 ${body.message ?? 'rejected'}`);
      return;
    }
    if (!Number.isFinite(Number(body?.close))) {
      report('Market data', 'failed', `${masked(key)} \u2014 no price in response`);
      return;
    }

    report('Market data', 'ok', `${masked(key)} \u2014 AAPL at ${Number(body.close).toFixed(2)}`);
  } catch (error) {
    report('Market data', 'failed', error instanceof Error ? error.message : 'unknown error');
  }
}

async function checkIbkr() {
  if (!integrations.ibkr()) {
    report('Interactive Brokers', 'not configured', 'IBKR_GATEWAY_URL unset \u2014 serving sample positions');
    return;
  }

  try {
    const response = await fetch(new URL('/v1/api/portfolio/accounts', ibkrConfig.baseUrl), {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json' },
    });

    if (response.status === 401) {
      report('Interactive Brokers', 'failed', 'gateway reachable, session not authenticated \u2014 log in at the gateway');
      return;
    }
    if (!response.ok) {
      report('Interactive Brokers', 'failed', `gateway returned HTTP ${response.status}`);
      return;
    }

    const accounts = await response.json();
    const count = Array.isArray(accounts) ? accounts.length : 0;
    if (count === 0) {
      report('Interactive Brokers', 'failed', 'gateway authenticated but returned no accounts');
      return;
    }

    report('Interactive Brokers', 'ok', `${count} account${count === 1 ? '' : 's'} via ${ibkrConfig.baseUrl}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    report('Interactive Brokers', 'failed', `${ibkrConfig.baseUrl} unreachable \u2014 ${reason}`);
  }
}

async function checkStripe() {
  if (!integrations.stripe()) {
    report('Stripe', 'not configured', 'STRIPE_SECRET_KEY unset \u2014 checkout answers 503');
    return;
  }

  const secret = stripeConfig.secretKey!;
  if (secret.startsWith('sk_live_')) {
    console.log(colour(33, '!') + ' Stripe key is a LIVE key. Real charges are possible.');
  }

  try {
    // The cheapest authenticated call that proves the key works.
    const account = await stripeFor(secret).accounts.retrieve();
    report('Stripe', 'ok', `${masked(secret)} \u2014 account ${account.id}`);
  } catch (error) {
    report('Stripe', 'failed', `${masked(secret)} \u2014 ${error instanceof Error ? error.message : 'unknown error'}`);
    return;
  }

  // Prices are configured separately from the key, and a missing one only
  // surfaces when someone tries to buy that plan.
  for (const plan of ['pro', 'premium'] as const) {
    const priceId = stripeConfig.prices[plan];
    if (!priceId) {
      report(`  ${plan} price`, 'failed', `STRIPE_PRICE_${plan.toUpperCase()} unset \u2014 that plan cannot be bought`);
      continue;
    }
    try {
      const price = await stripeFor(secret).prices.retrieve(priceId);
      const amount = price.unit_amount != null ? (price.unit_amount / 100).toFixed(2) : '?';
      report(`  ${plan} price`, 'ok', `${priceId} \u2014 ${amount} ${price.currency.toUpperCase()}`);
    } catch (error) {
      report(`  ${plan} price`, 'failed', `${priceId} \u2014 ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  if (!integrations.stripeWebhook()) {
    report('  webhook secret', 'failed', 'STRIPE_WEBHOOK_SECRET unset \u2014 the webhook refuses every event');
  } else {
    report('  webhook secret', 'ok', masked(stripeConfig.webhookSecret!));
  }
}

console.log('\nIntegration status\n');
await checkMarketData();
await checkIbkr();
await checkStripe();

console.log(
  failures === 0
    ? '\nNothing configured is broken.\n'
    : `\n${failures} configured integration${failures === 1 ? '' : 's'} did not work. The app still runs \u2014 those features serve sample data or answer 503.\n`,
);

// Non-zero only when something configured is broken. An unconfigured
// integration is a deliberate choice, not a failure, so it must not break a
// deploy check.
process.exit(failures === 0 ? 0 : 1);
