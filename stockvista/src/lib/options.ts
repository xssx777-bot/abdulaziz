function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2);
  return 0.5 * (1 + sign * (y - 0.5) * 2);
}

export interface OptionsResult {
  callPrice: number;
  putPrice: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function calculateBlackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put'
): OptionsResult {
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const Nd1_neg = normalCDF(-d1);
  const Nd2_neg = normalCDF(-d2);

  const callPrice = S * Nd1 - K * Math.exp(-r * T) * Nd2;
  const putPrice = K * Math.exp(-r * T) * Nd2_neg - S * Nd1_neg;

  const pdf = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * d1 * d1);

  const delta = type === 'call' ? Nd1 : Nd1 - 1;
  const gamma = pdf / (S * sigma * Math.sqrt(T));
  const theta =
    type === 'call'
      ? -(S * pdf * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2
      : -(S * pdf * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * Nd2_neg;

  return {
    callPrice,
    putPrice,
    delta,
    gamma,
    theta: theta / 365,
    vega: S * pdf * Math.sqrt(T) / 100,
    rho: ((type === 'call' ? 1 : -1) * K * T * Math.exp(-r * T) * (type === 'call' ? Nd2 : Nd2_neg)) / 100,
  };
}
