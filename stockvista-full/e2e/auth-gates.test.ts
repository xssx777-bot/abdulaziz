/**
 * Covers what the in-process route tests cannot: handlers that call auth(),
 * which calls Next's headers() and needs a real request scope.
 *
 * These go over HTTP to a running production server, so the request scope is
 * genuine rather than simulated.
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

test('the profile route refuses a caller with no session', async () => {
  const response = await fetch(`${server.url}/api/user/profile`);
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /unauthorized/i);
});

test('the profile route refuses a caller with a junk session cookie', async () => {
  const response = await fetch(`${server.url}/api/user/profile`, {
    headers: { cookie: 'authjs.session-token=not-a-real-token' },
  });
  assert.equal(response.status, 401);
});

test('the profile update route refuses a caller with no session', async () => {
  const response = await fetch(`${server.url}/api/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Someone Else' }),
  });
  assert.equal(response.status, 401);
});

test('the checkout route refuses a caller with no session', async () => {
  const response = await fetch(`${server.url}/api/stripe/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: 'pro' }),
  });
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /unauthorized/i);
});

test('a protected page redirects an unauthenticated visitor to sign in', async () => {
  for (const locale of ['en', 'ar']) {
    const response = await fetch(`${server.url}/${locale}/dashboard`, { redirect: 'manual' });
    assert.equal(response.status, 307, `/${locale}/dashboard should redirect`);
    assert.match(
      response.headers.get('location') ?? '',
      new RegExp(`/${locale}/auth/login$`),
      `should keep the visitor in /${locale}`,
    );
  }
});

test('public routes stay reachable without a session', async () => {
  for (const path of ['/en', '/ar', '/en/auth/login', '/en/auth/register', '/api/tadawul/stocks']) {
    const response = await fetch(`${server.url}${path}`);
    assert.equal(response.status, 200, `${path} should be public`);
  }
});
