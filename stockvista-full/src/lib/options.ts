export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionResult {
  price: number;
  greeks: OptionGreeks;
}

export interface OptionCalculatorInput {
  spotPrice: number;
  strikePrice: number;
  timeToExpiry: number;
  riskFreeRate: number;
  volatility: number;
  dividendYield: number;
}

const N = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  // Abramowitz & Stegun 7.1.26: erf(x) ≈ 1 - (a1·t + a2·t² + a3·t³ + a4·t⁴ + a5·t⁵)·e^(-x²).
  // Each term already carries its own power of t, so the sum is not multiplied by t again.
  const y = 1.0 - (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
};

const n = (x: number): number => {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
};

export const calculateBlackScholesCall = (input: OptionCalculatorInput): OptionResult => {
  const { spotPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma, dividendYield: q } = input;

  const d1 = (Math.log(S / K) + (r - q + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const price = S * Math.exp(-q * T) * N(d1) - K * Math.exp(-r * T) * N(d2);

  const greeks: OptionGreeks = {
    delta: Math.exp(-q * T) * N(d1),
    gamma: Math.exp(-q * T) * n(d1) / (S * sigma * Math.sqrt(T)),
    theta: (-S * Math.exp(-q * T) * n(d1) * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * N(d2) + q * S * Math.exp(-q * T) * N(d1)) / 365,
    vega: S * Math.exp(-q * T) * n(d1) * Math.sqrt(T) / 100,
    rho: K * T * Math.exp(-r * T) * N(d2) / 100,
  };

  return { price, greeks };
};

export const calculateBlackScholesPut = (input: OptionCalculatorInput): OptionResult => {
  const { spotPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma, dividendYield: q } = input;

  const d1 = (Math.log(S / K) + (r - q + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const price = K * Math.exp(-r * T) * N(-d2) - S * Math.exp(-q * T) * N(-d1);

  const greeks: OptionGreeks = {
    delta: Math.exp(-q * T) * (N(d1) - 1),
    gamma: Math.exp(-q * T) * n(d1) / (S * sigma * Math.sqrt(T)),
    theta: (-S * Math.exp(-q * T) * n(d1) * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * N(-d2) - q * S * Math.exp(-q * T) * N(-d1)) / 365,
    vega: S * Math.exp(-q * T) * n(d1) * Math.sqrt(T) / 100,
    rho: -K * T * Math.exp(-r * T) * N(-d2) / 100,
  };

  return { price, greeks };
};
