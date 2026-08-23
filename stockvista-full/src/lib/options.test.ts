import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBlackScholesCall,
  calculateBlackScholesPut,
  type OptionCalculatorInput,
} from './options';

const input = (
  spotPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number,
  dividendYield = 0,
): OptionCalculatorInput => ({
  spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield,
});

// The normal CDF is an Abramowitz & Stegun approximation, accurate to ~7.5e-8,
// so prices are compared to 4 decimal places rather than exactly.
const close = (actual: number, expected: number, tolerance = 1e-4) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `expected ${expected}, got ${actual} (difference ${Math.abs(actual - expected)})`,
  );

// S=100, K=100, T=1y, r=5%, σ=20%, q=0 — the standard worked example.
const atTheMoney = input(100, 100, 1, 0.05, 0.20);

test('call price matches the reference value', () => {
  close(calculateBlackScholesCall(atTheMoney).price, 10.4506);
});

test('put price matches the reference value', () => {
  close(calculateBlackScholesPut(atTheMoney).price, 5.5735);
});

test('call and put deltas match the reference values', () => {
  close(calculateBlackScholesCall(atTheMoney).greeks.delta, 0.6368);
  close(calculateBlackScholesPut(atTheMoney).greeks.delta, -0.3632);
});

test('gamma and vega match the reference values', () => {
  const { gamma, vega } = calculateBlackScholesCall(atTheMoney).greeks;
  close(gamma, 0.018762, 1e-6);
  close(vega, 0.3752);
});

// Put-call parity is structural: it must hold whatever the CDF approximation
// costs in accuracy, so it catches errors in the pricing formulae themselves.
test('put-call parity holds, with and without a dividend yield', () => {
  for (const [S, K, T, r, v, q] of [
    [100, 100, 1, 0.05, 0.20, 0],
    [100, 100, 1, 0.05, 0.20, 0.03],
    [ 87, 110, 0.5, 0.02, 0.45, 0.01],
    [250,  90, 2, 0.07, 0.15, 0.05],
  ]) {
    const i = input(S, K, T, r, v, q);
    const difference = calculateBlackScholesCall(i).price - calculateBlackScholesPut(i).price;
    const forward = S * Math.exp(-q * T) - K * Math.exp(-r * T);
    close(difference, forward, 1e-9);
  }
});

test('gamma and vega are identical for a call and a put on the same contract', () => {
  const call = calculateBlackScholesCall(atTheMoney).greeks;
  const put = calculateBlackScholesPut(atTheMoney).greeks;
  close(call.gamma, put.gamma, 1e-12);
  close(call.vega, put.vega, 1e-12);
});

test('deltas stay inside their bounds across a range of moneyness', () => {
  for (const spot of [10, 50, 90, 100, 110, 200, 500]) {
    const i = input(spot, 100, 1, 0.05, 0.20);
    const callDelta = calculateBlackScholesCall(i).greeks.delta;
    const putDelta = calculateBlackScholesPut(i).greeks.delta;
    assert.ok(callDelta >= 0 && callDelta <= 1, `call delta ${callDelta} out of [0,1] at spot ${spot}`);
    assert.ok(putDelta >= -1 && putDelta <= 0, `put delta ${putDelta} out of [-1,0] at spot ${spot}`);
    close(callDelta - putDelta, 1, 1e-9); // delta parity at q=0
  }
});

test('gamma and vega are positive everywhere', () => {
  for (const spot of [50, 100, 150]) {
    const { gamma, vega } = calculateBlackScholesCall(input(spot, 100, 1, 0.05, 0.20)).greeks;
    assert.ok(gamma > 0, `gamma ${gamma} not positive at spot ${spot}`);
    assert.ok(vega > 0, `vega ${vega} not positive at spot ${spot}`);
  }
});

test('a deep in-the-money call approaches its forward intrinsic value', () => {
  const price = calculateBlackScholesCall(input(200, 50, 1, 0.05, 0.20)).price;
  close(price, 200 - 50 * Math.exp(-0.05), 1e-3);
});

test('a deep out-of-the-money call approaches zero', () => {
  const price = calculateBlackScholesCall(input(50, 200, 1, 0.05, 0.20)).price;
  assert.ok(price >= 0 && price < 1e-6, `expected ~0, got ${price}`);
});

test('a call is never worth less than its intrinsic value', () => {
  for (const spot of [80, 100, 130, 180]) {
    const price = calculateBlackScholesCall(input(spot, 100, 0.75, 0.05, 0.25)).price;
    assert.ok(price >= Math.max(0, spot - 100) - 1e-9, `price ${price} below intrinsic at spot ${spot}`);
  }
});

test('a call is worth more as volatility rises', () => {
  let previous = -Infinity;
  for (const volatility of [0.05, 0.10, 0.20, 0.40, 0.80]) {
    const price = calculateBlackScholesCall(input(100, 100, 1, 0.05, volatility)).price;
    assert.ok(price > previous, `price ${price} did not rise at volatility ${volatility}`);
    previous = price;
  }
});

test('theta is negative for a long at-the-money option', () => {
  assert.ok(calculateBlackScholesCall(atTheMoney).greeks.theta < 0);
  assert.ok(calculateBlackScholesPut(atTheMoney).greeks.theta < 0);
});
