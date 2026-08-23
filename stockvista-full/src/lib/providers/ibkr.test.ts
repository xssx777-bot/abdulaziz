import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getAccounts, getPositions } from './ibkr';

const realFetch = globalThis.fetch;

const stubFetch = (handler: (url: string) => { status?: number; body: unknown }) => {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input.toString();
    const { status = 200, body } = handler(url);
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
};

beforeEach(() => {
  delete process.env.IBKR_GATEWAY_URL;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.IBKR_GATEWAY_URL;
});

test('without a gateway it serves sample accounts and says so', async () => {
  const result = await getAccounts();
  assert.equal(result.source, 'sample');
  assert.equal(result.warning, undefined);
  assert.ok(result.data.length > 0);
});

test('without a gateway it makes no network call', async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response('[]');
  }) as typeof fetch;

  await getAccounts();
  await getPositions('U123');

  assert.equal(called, false);
});

test('with a gateway it maps accounts from the Client Portal shape', async () => {
  process.env.IBKR_GATEWAY_URL = 'https://localhost:5000';
  stubFetch(() => ({
    body: [
      { accountId: 'U7654321', accountAlias: 'Margin', currency: 'USD' },
      { accountId: 'U7654322', currency: 'SAR' },
    ],
  }));

  const result = await getAccounts();

  assert.equal(result.source, 'live');
  assert.equal(result.data.length, 2);
  assert.equal(result.data[0].id, 'U7654321');
  assert.equal(result.data[0].alias, 'Margin');
  assert.equal(result.data[1].alias, undefined, 'an absent alias stays absent');
});

test('a lapsed gateway session degrades with an actionable warning', async () => {
  process.env.IBKR_GATEWAY_URL = 'https://localhost:5000';
  stubFetch(() => ({ status: 401, body: { error: 'not authenticated' } }));

  const result = await getAccounts();

  assert.equal(result.source, 'sample');
  assert.match(result.warning ?? '', /session has lapsed/i);
  assert.match(result.warning ?? '', /log in again/i, 'the warning should say what to do');
});

test('positions are mapped and the account id is escaped into the path', async () => {
  process.env.IBKR_GATEWAY_URL = 'https://localhost:5000';
  let requestedPath = '';
  stubFetch((url) => {
    requestedPath = new URL(url).pathname;
    return {
      body: [
        { contractDesc: 'AAPL', name: 'Apple Inc.', position: 120, avgCost: 162.4, mktPrice: 178.42, mktValue: 21410.4, unrealizedPnl: 1922.4, currency: 'USD' },
      ],
    };
  });

  const result = await getPositions('U 765/4321');

  assert.equal(result.source, 'live');
  assert.equal(requestedPath, '/v1/api/portfolio/U%20765%2F4321/positions/0');
  assert.equal(result.data[0].symbol, 'AAPL');
  assert.equal(result.data[0].quantity, 120);
  assert.equal(result.data[0].unrealizedPnl, 1922.4);
});

test('positions with unparseable numbers become zero rather than NaN', async () => {
  process.env.IBKR_GATEWAY_URL = 'https://localhost:5000';
  stubFetch(() => ({
    body: [{ contractDesc: 'MSFT', position: null, avgCost: 'n/a', mktPrice: undefined }],
  }));

  const result = await getPositions('U1');

  assert.equal(result.data[0].quantity, 0);
  assert.equal(result.data[0].averageCost, 0);
  assert.ok(!Number.isNaN(result.data[0].marketPrice), 'NaN would render as "NaN" on screen');
});

test('an empty account list is treated as a failure, not an empty portfolio', async () => {
  process.env.IBKR_GATEWAY_URL = 'https://localhost:5000';
  stubFetch(() => ({ body: [] }));

  const result = await getAccounts();

  assert.equal(result.source, 'sample');
  assert.match(result.warning ?? '', /no accounts/i);
});
