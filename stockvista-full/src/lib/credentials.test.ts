import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail, isValidEmail } from './credentials';

test('normalization lowercases and trims', () => {
  assert.equal(normalizeEmail('  Abdulaziz@Example.COM '), 'abdulaziz@example.com');
  assert.equal(normalizeEmail('already@lower.com'), 'already@lower.com');
});

test('normalization is idempotent', () => {
  const once = normalizeEmail(' A@B.Com ');
  assert.equal(normalizeEmail(once), once);
});

test('normalization leaves provider-specific parts alone', () => {
  // Dots and plus-addressing are not universally equivalent, so they stay.
  assert.equal(normalizeEmail('first.last+tag@gmail.com'), 'first.last+tag@gmail.com');
});

test('valid addresses are accepted', () => {
  for (const address of [
    'a@b.co',
    'abdulaziz@example.com',
    'first.last+tag@sub.domain.org',
    'user@tadawul.com.sa',
  ]) {
    assert.ok(isValidEmail(address), `${address} should be valid`);
  }
});

test('malformed addresses are rejected', () => {
  for (const address of [
    'notanemail',
    'no@domain',
    '@example.com',
    'user@',
    'two@@example.com',
    'has space@example.com',
    'user@exam ple.com',
    '',
  ]) {
    assert.ok(!isValidEmail(address), `${address} should be rejected`);
  }
});
