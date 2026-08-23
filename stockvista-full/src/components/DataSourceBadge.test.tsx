import '../test-setup/dom';

import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, screen, cleanup } from '@testing-library/react';
import DataSourceBadge from './DataSourceBadge';

afterEach(cleanup);

test('live data carries no badge', () => {
  const { container } = render(<DataSourceBadge source="live" />);
  assert.equal(container.textContent, '', 'a clean live feed needs no chrome');
});

test('sample data is always labelled', () => {
  render(<DataSourceBadge source="sample" />);
  assert.ok(screen.getByText('Sample data'));
});

test('a live call that fell back explains itself on hover', () => {
  render(<DataSourceBadge source="sample" warning="Live market data unavailable (429); showing sample prices." />);

  const badge = screen.getByText('Sample data');
  assert.match(badge.getAttribute('title') ?? '', /429/);
});

test('a live source with a warning still warns', () => {
  // Degraded-but-live: the badge must not disappear just because source is live.
  render(<DataSourceBadge source="live" warning="Partial data returned." />);
  assert.ok(screen.getByText('Sample data'));
});
