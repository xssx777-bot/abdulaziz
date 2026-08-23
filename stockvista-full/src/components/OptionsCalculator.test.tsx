import '../test-setup/dom';

import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import OptionsCalculator from './OptionsCalculator';

afterEach(cleanup);

/** Reads the value under a labelled tile, e.g. "Price" or "Delta". */
function tileValue(label: string): string {
  const heading = screen.getByText(label);
  const value = heading.parentElement?.querySelector('p:last-child');
  assert.ok(value, `no value found under "${label}"`);
  return value.textContent ?? '';
}

const slider = (labelStart: string) => {
  const label = screen.getByText((text) => text.startsWith(labelStart));
  const input = label.parentElement?.querySelector('input[type="range"]');
  assert.ok(input, `no slider found for "${labelStart}"`);
  return input as HTMLInputElement;
};

test('renders the reference price for its default inputs', () => {
  render(<OptionsCalculator />);
  // Defaults: S=100, K=100, T=0.25y, r=5%, sigma=20%, q=0 — a call worth 4.6150.
  assert.equal(tileValue('Price'), '$4.61');
});

test('shows the full Greek surface', () => {
  render(<OptionsCalculator />);
  for (const greek of ['Delta', 'Gamma', 'Theta', 'Vega', 'Rho']) {
    const value = tileValue(greek);
    assert.match(value, /^-?\d+\.\d+$/, `${greek} should render a number, got "${value}"`);
  }
});

test('raising volatility raises the price', () => {
  render(<OptionsCalculator />);
  const before = Number(tileValue('Price').replace('$', ''));

  fireEvent.change(slider('Volatility'), { target: { value: '0.8' } });

  const after = Number(tileValue('Price').replace('$', ''));
  assert.ok(after > before, `price should rise: ${before} -> ${after}`);
});

test('switching to a put changes the price and flips delta negative', () => {
  render(<OptionsCalculator />);
  const callPrice = tileValue('Price');
  assert.ok(Number(tileValue('Delta')) > 0, 'a call should have positive delta');

  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'put' } });

  assert.notEqual(tileValue('Price'), callPrice);
  assert.ok(Number(tileValue('Delta')) < 0, 'a put should have negative delta');
});

test('a deep out-of-the-money call is worth about nothing', () => {
  render(<OptionsCalculator />);
  fireEvent.change(slider('Spot Price'), { target: { value: '20' } });
  fireEvent.change(slider('Strike Price'), { target: { value: '400' } });

  assert.equal(tileValue('Price'), '$0.00');
});

test('a deep in-the-money call tracks its intrinsic value', () => {
  render(<OptionsCalculator />);
  fireEvent.change(slider('Spot Price'), { target: { value: '400' } });
  fireEvent.change(slider('Strike Price'), { target: { value: '20' } });

  const price = Number(tileValue('Price').replace('$', ''));
  assert.ok(price > 379, `expected roughly 400 - 20 discounted, got ${price}`);
  assert.ok(price < 381, `expected roughly 400 - 20 discounted, got ${price}`);
});

test('moving a slider updates the label beside it', () => {
  render(<OptionsCalculator />);
  fireEvent.change(slider('Spot Price'), { target: { value: '250' } });
  assert.ok(screen.getByText('Spot Price: $250.00'));
});
