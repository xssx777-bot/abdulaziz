/**
 * Integration configuration, read from the environment on each access.
 *
 * Reads are lazy rather than a snapshot taken at import time: a frozen snapshot
 * silently misses anything populated after the module loads — which is how some
 * deployments inject secrets, and how tests set them up.
 *
 * Every integration is optional. When credentials are absent the app still
 * runs — providers fall back to sample data and label it as such. Nothing here
 * throws at import time, so a missing key degrades one feature rather than
 * taking the process down.
 */

const trimmed = (value: string | undefined): string | undefined => {
  const text = value?.trim();
  return text ? text : undefined;
};

export const marketDataConfig = {
  get apiKey() {
    return trimmed(process.env.MARKET_DATA_API_KEY);
  },
  get baseUrl() {
    return trimmed(process.env.MARKET_DATA_BASE_URL) ?? 'https://api.twelvedata.com';
  },
  /** Seconds to cache a quote. Providers bill per request; this bounds the spend. */
  get cacheSeconds() {
    const seconds = Number(process.env.MARKET_DATA_CACHE_SECONDS);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : 30;
  },
};

export const ibkrConfig = {
  /**
   * IBKR's Client Portal API is served by a gateway you run yourself — there is
   * no cloud endpoint to point an API key at. This is the gateway's address,
   * typically https://localhost:5000 in development.
   */
  get baseUrl() {
    return trimmed(process.env.IBKR_GATEWAY_URL);
  },
  /** The gateway ships with a self-signed certificate. */
  get rejectUnauthorized() {
    return process.env.IBKR_REJECT_UNAUTHORIZED !== 'false';
  },
};

export const stripeConfig = {
  get secretKey() {
    return trimmed(process.env.STRIPE_SECRET_KEY);
  },
  get webhookSecret() {
    return trimmed(process.env.STRIPE_WEBHOOK_SECRET);
  },
  get prices() {
    return {
      pro: trimmed(process.env.STRIPE_PRICE_PRO),
      premium: trimmed(process.env.STRIPE_PRICE_PREMIUM),
    };
  },
};

export const appConfig = {
  get url() {
    return trimmed(process.env.NEXTAUTH_URL) ?? 'http://localhost:3000';
  },
};

export const integrations = {
  marketData: () => Boolean(marketDataConfig.apiKey),
  ibkr: () => Boolean(ibkrConfig.baseUrl),
  stripe: () => Boolean(stripeConfig.secretKey),
  stripeWebhook: () => Boolean(stripeConfig.webhookSecret),
} as const;

/** Which source a response was built from. Never let the two be confused. */
export type DataSource = 'live' | 'sample';
