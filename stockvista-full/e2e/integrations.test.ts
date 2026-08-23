/**
 * The integration routes as a running server serves them, with no credentials
 * configured — which is the state CI runs in, and the state a fresh clone
 * starts in.
 *
 * What matters here is that the unconfigured path is honest: data routes still
 * answer, but say the data is sample; routes that cannot do anything useful
 * without a key say so with a 503 rather than pretending to succeed.
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, type TestServer } from './server';

let server: TestServer;

before(async () => {
  server = await startTestServer();
});

after(async () => {
  await server?.stop();
});

test('market data routes label sample data as sample', async () => {
  for (const path of ['/api/stock/search', '/api/tadawul/stocks']) {
    const response = await fetch(`${server.url}${path}`);
    assert.equal(response.status, 200, `${path} should still answer`);

    const body = await response.json();
    assert.equal(body.source, 'sample', `${path} must not present sample prices as live`);
  }
});

test('search still filters when serving sample data', async () => {
  const response = await fetch(`${server.url}/api/stock/search?q=aramco`);
  const body = await response.json();

  assert.equal(body.results.length, 1);
  assert.equal(body.results[0].market, 'tadawul');
});

test('Tadawul quotes carry Saudi symbols and currency', async () => {
  const { stocks } = await (await fetch(`${server.url}/api/tadawul/stocks`)).json();

  assert.ok(stocks.length > 0);
  for (const stock of stocks) {
    assert.match(stock.symbol, /^\d{4}$/);
    assert.equal(stock.currency, 'SAR');
  }
});

test('the broker routes refuse an unauthenticated caller', async () => {
  const accounts = await fetch(`${server.url}/api/ibkr/accounts`);
  assert.equal(accounts.status, 401);

  const positions = await fetch(`${server.url}/api/ibkr/positions?accountId=U1`);
  assert.equal(positions.status, 401);
});

test('checkout refuses an unauthenticated caller before it checks configuration', async () => {
  const response = await fetch(`${server.url}/api/stripe/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: 'pro' }),
  });

  assert.equal(response.status, 401, 'an anonymous caller learns nothing about the deployment');
});

test('the webhook answers 503 when Stripe is not configured', async () => {
  const response = await fetch(`${server.url}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'checkout.session.completed' }),
  });

  assert.equal(response.status, 503);
});

test('an unsigned webhook is never accepted', async () => {
  const response = await fetch(`${server.url}/api/stripe/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'customer.subscription.updated' }),
  });

  assert.notEqual(response.status, 200, 'an unsigned event must never be applied');
});
