/**
 * The provider is exercised against a stubbed `fetch` rather than the real
 * vendor: these tests must run in CI without a key, and must not spend quota.
 * What they check is the contract callers depend on — that a response always
 * says whether it is live or sample, and that a live failure degrades instead
 * of throwing.
 */
import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const realFetch = globalThis.fetch;

// Config reads the environment lazily, so a plain import is enough — no
// module-cache tricks needed to change what the provider sees.
const loadProvider = () => import('./marketData');

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
  delete process.env.MARKET_DATA_API_KEY;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.MARKET_DATA_API_KEY;
});

test('without a key it serves sample quotes and says so', async () => {
  const { getQuotes } = await loadProvider();
  const result = await getQuotes();

  assert.equal(result.source, 'sample');
  assert.equal(result.warning, undefined, 'an unconfigured provider is not a failure');
  assert.ok(result.data.length > 0);
});

test('without a key it makes no network call', async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response('{}');
  }) as typeof fetch;

  const { getQuotes } = await loadProvider();
  await getQuotes();

  assert.equal(called, false, 'should not reach the network with no key configured');
});

test('with a key it returns live quotes', async () => {
  process.env.MARKET_DATA_API_KEY = 'test-key';
  stubFetch(() => ({
    body: {
      AAPL: { symbol: 'AAPL', name: 'Apple Inc.', close: '191.25', change: '2.10', percent_change: '1.11', currency: 'USD' },
      '2222:Tadawul': { symbol: '2222', name: 'Saudi Aramco', close: '37.05', change: '0.35', percent_change: '0.95', currency: 'SAR' },
    },
  }));

  const { getQuotes } = await loadProvider();
  const result = await getQuotes(['AAPL', '2222']);

  assert.equal(result.source, 'live');
  assert.equal(result.warning, undefined);

  const apple = result.data.find((quote) => quote.symbol === 'AAPL');
  assert.equal(apple?.price, 191.25);
  assert.equal(apple?.market, 'us');

  const aramco = result.data.find((quote) => quote.symbol === '2222');
  assert.equal(aramco?.price, 37.05);
  assert.equal(aramco?.market, 'tadawul', 'four-digit symbols are Tadawul listings');
  assert.equal(aramco?.currency, 'SAR');
});

test('a single symbol comes back bare rather than keyed', async () => {
  process.env.MARKET_DATA_API_KEY = 'test-key';
  stubFetch(() => ({
    body: { symbol: 'MSFT', name: 'Microsoft Corp.', close: '402.11', change: '1.90', percent_change: '0.47', currency: 'USD' },
  }));

  const { getQuotes } = await loadProvider();
  const result = await getQuotes(['MSFT']);

  assert.equal(result.source, 'live');
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].price, 402.11);
});

test('Tadawul symbols get the exchange suffix the vendor expects', async () => {
  process.env.MARKET_DATA_API_KEY = 'test-key';
  let requested = '';
  stubFetch((url) => {
    requested = new URL(url).searchParams.get('symbol') ?? '';
    return { body: { '1120:Tadawul': { symbol: '1120', close: '86.10', currency: 'SAR' } } };
  });

  const { getQuotes } = await loadProvider();
  await getQuotes(['1120']);

  assert.equal(requested, '1120:Tadawul');
});

test('an HTTP failure degrades to sample data with a warning', async () => {
  process.env.MARKET_DATA_API_KEY = 'test-key';
  stubFetch(() => ({ status: 500, body: { message: 'upstream exploded' } }));

  const { getQuotes } = await loadProvider();
  const result = await getQuotes();

  assert.equal(result.source, 'sample');
  assert.match(result.warning ?? '', /unavailable/i);
  assert.ok(result.data.length > 0, 'callers still get something to render');
});

test('a vendor error reported in the body is treated as a failure', async () => {
  process.env.MARKET_DATA_API_KEY = 'test-key';
  // The vendor answers 200 with an error payload when a key is out of quota.
  stubFetch(() => ({ body: { status: 'error', message: 'API credits exhausted' } }));

  const { getQuotes } = await loadProvider();
  const result = await getQuotes(['AAPL']);

  assert.equal(result.source, 'sample');
  assert.match(result.warning ?? '', /credits exhausted/i);
});

test('a thrown network error degrades rather than propagating', async () => {
  process.env.MARKET_DATA_API_KEY = 'test-key';
  globalThis.fetch = (async () => {
    throw new Error('ECONNREFUSED');
  }) as typeof fetch;

  const { getQuotes } = await loadProvider();
  const result = await getQuotes();

  assert.equal(result.source, 'sample');
  assert.match(result.warning ?? '', /ECONNREFUSED/);
});

test('the Tadawul view returns only Saudi listings', async () => {
  const { getTadawulQuotes } = await loadProvider();
  const result = await getTadawulQuotes();

  assert.ok(result.data.length > 0);
  for (const quote of result.data) {
    assert.equal(quote.market, 'tadawul');
    assert.equal(quote.currency, 'SAR');
  }
});

test('search filters by symbol and name, and keeps the source', async () => {
  const { searchQuotes } = await loadProvider();

  const bySymbol = await searchQuotes('aapl');
  assert.equal(bySymbol.data.length, 1);
  assert.equal(bySymbol.source, 'sample');

  const byName = await searchQuotes('rajhi');
  assert.equal(byName.data.length, 1);
  assert.equal(byName.data[0].market, 'tadawul');

  assert.deepEqual((await searchQuotes('nothing-matches')).data, []);
  assert.ok((await searchQuotes(null)).data.length > 1, 'no query returns everything');
});
