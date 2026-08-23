/**
 * Integration tests for the API route handlers.
 *
 * Route handlers are ordinary functions from Request to Response, so they are
 * called directly — no server, no HTTP. Handlers that touch the database run
 * against a real throwaway SQLite file rather than a mocked Prisma client, so
 * unique constraints and column types are genuinely exercised.
 */
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workspace = mkdtempSync(join(tmpdir(), 'stockvista-test-'));
process.env.DATABASE_URL = `file:${join(workspace, 'test.db')}`;
process.env.AUTH_SECRET ??= 'test_secret';

type Prisma = typeof import('@/lib/prisma')['prisma'];
let prisma: Prisma;

before(() => {
  // db push rather than migrate deploy: the schema is the source of truth here
  // and this keeps the test independent of the migration history.
  execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
    env: process.env,
    stdio: 'pipe',
  });
});

beforeEach(async () => {
  ({ prisma } = await import('@/lib/prisma'));
  await prisma.user.deleteMany();
});

after(async () => {
  if (prisma) await prisma.$disconnect();
  rmSync(workspace, { recursive: true, force: true });
});

const register = async (body: unknown) => {
  const { POST } = await import('@/app/api/auth/register/route');
  return POST(new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
};

const valid = { email: 'abdulaziz@example.com', password: 'a-good-password', name: 'Abdulaziz' };

test('registration creates a user', async () => {
  const response = await register(valid);
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.success, true);
  assert.ok(body.userId);

  const stored = await prisma.user.findUnique({ where: { email: valid.email } });
  assert.ok(stored);
  assert.equal(stored.name, 'Abdulaziz');
  assert.equal(stored.subscriptionTier, 'free');
});

test('the password is stored hashed, never in the clear', async () => {
  await register(valid);
  const stored = await prisma.user.findUniqueOrThrow({ where: { email: valid.email } });

  assert.notEqual(stored.password, valid.password);
  assert.match(stored.password, /^\$2[aby]\$/, 'expected a bcrypt hash');

  const bcrypt = (await import('bcryptjs')).default;
  assert.ok(await bcrypt.compare(valid.password, stored.password));
});

test('addresses differing only by case or whitespace are the same account', async () => {
  const first = await register({ ...valid, email: 'Abdulaziz@Example.com' });
  assert.equal(first.status, 201);

  const second = await register({ ...valid, email: '  abdulaziz@EXAMPLE.com  ' });
  assert.equal(second.status, 409, 'a second account was created for the same address');

  assert.equal(await prisma.user.count(), 1);
  const stored = await prisma.user.findFirstOrThrow();
  assert.equal(stored.email, 'abdulaziz@example.com', 'the address should be stored normalized');
});

test('a duplicate registration is refused with 409', async () => {
  await register(valid);
  const response = await register(valid);
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /already registered/i);
  assert.equal(await prisma.user.count(), 1);
});

test('malformed addresses are refused', async () => {
  for (const email of ['notanemail', 'no@domain', '@example.com', 'has space@example.com']) {
    const response = await register({ ...valid, email });
    assert.equal(response.status, 400, `${email} should be refused`);
  }
  assert.equal(await prisma.user.count(), 0);
});

test('a short password is refused and names the minimum', async () => {
  const response = await register({ ...valid, password: '1234567' });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /8 characters/);
  assert.equal(await prisma.user.count(), 0);
});

test('a missing or non-string field is refused rather than throwing', async () => {
  for (const body of [
    {},
    { email: valid.email },
    { password: valid.password },
    { email: 123, password: valid.password },
    { email: valid.email, password: null },
  ]) {
    const response = await register(body);
    assert.equal(response.status, 400, `${JSON.stringify(body)} should be refused`);
  }
  assert.equal(await prisma.user.count(), 0);
});

test('a blank name is stored as null rather than an empty string', async () => {
  await register({ ...valid, name: '   ' });
  const stored = await prisma.user.findUniqueOrThrow({ where: { email: valid.email } });
  assert.equal(stored.name, null);
});

test('a malformed request body returns 500 rather than crashing', async () => {
  const { POST } = await import('@/app/api/auth/register/route');
  const response = await POST(new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json',
  }));
  assert.equal(response.status, 500);
});

test('stock search filters by symbol and by name, case-insensitively', async () => {
  const { GET } = await import('@/app/api/stock/search/route');
  const search = async (q: string) =>
    (await (await GET(new Request(`http://localhost/api/stock/search?q=${encodeURIComponent(q)}`))).json()).results;

  const bySymbol = await search('aapl');
  assert.equal(bySymbol.length, 1);
  assert.equal(bySymbol[0].symbol, 'AAPL');

  const byName = await search('rajhi');
  assert.equal(byName.length, 1);
  assert.equal(byName[0].market, 'tadawul');

  assert.deepEqual(await search('nothing-matches-this'), []);
});

test('stock search with no query returns every instrument', async () => {
  const { GET } = await import('@/app/api/stock/search/route');
  const results = (await (await GET(new Request('http://localhost/api/stock/search'))).json()).results;
  assert.ok(results.length > 0);
  for (const stock of results) {
    assert.equal(typeof stock.symbol, 'string');
    assert.equal(typeof stock.price, 'number');
  }
});

test('tadawul quotes come back with the expected shape', async () => {
  const { GET } = await import('@/app/api/tadawul/stocks/route');
  const { stocks } = await (await GET()).json();
  assert.ok(stocks.length > 0);
  for (const stock of stocks) {
    assert.match(stock.symbol, /^\d{4}$/, 'Tadawul symbols are four digits');
    assert.equal(typeof stock.name, 'string');
    assert.equal(typeof stock.price, 'number');
    assert.equal(typeof stock.sector, 'string');
  }
});

test('whale transactions come back with the expected shape', async () => {
  const { GET } = await import('@/app/api/whale/transactions/route');
  const { transactions } = await (await GET()).json();
  assert.ok(transactions.length > 0);
  for (const transaction of transactions) {
    assert.equal(typeof transaction.symbol, 'string');
    assert.ok(transaction.quantity > 0);
    assert.ok(transaction.price > 0);
    assert.ok(['BUY', 'SELL'].includes(transaction.type));
  }
});

// The auth-gated routes (/api/user/profile, /api/stripe/create-checkout) are
// covered in e2e/auth-gates.test.ts, not here: they call auth(), which calls
// Next's headers(), which needs a real request scope. Those tests go over HTTP
// to a running server so the scope is genuine.
