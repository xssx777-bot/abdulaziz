import { marketDataConfig, integrations } from '@/lib/config';
import type { Quote, Sourced } from './types';

/**
 * Market data, live when a key is configured and sample otherwise.
 *
 * The live implementation targets Twelve Data, which covers both US venues and
 * Tadawul. Swapping vendors means rewriting `fetchLiveQuotes` and nothing else —
 * callers only see `Quote`.
 */

// Tadawul tickers are four digits; the vendor wants an exchange suffix.
const isTadawul = (symbol: string) => /^\d{4}$/.test(symbol.replace(/\..*$/, ''));
const vendorSymbol = (symbol: string) =>
  isTadawul(symbol) && !symbol.includes('.') ? `${symbol}:Tadawul` : symbol;

const SAMPLE: Quote[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 180.50, change: 2.30, changePercent: 1.29, currency: 'USD', market: 'us', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.20, change: 1.80, changePercent: 1.30, currency: 'USD', market: 'us', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 380.10, change: 3.20, changePercent: 0.85, currency: 'USD', market: 'us', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 487.30, change: 13.80, changePercent: 2.91, currency: 'USD', market: 'us', sector: 'Technology' },
  { symbol: '1120', name: 'Al Rajhi Bank', price: 85.50, change: 1.00, changePercent: 1.18, currency: 'SAR', market: 'tadawul', sector: 'Banking' },
  { symbol: '2010', name: 'Saudi Basic Industries', price: 92.30, change: -0.31, changePercent: -0.34, currency: 'SAR', market: 'tadawul', sector: 'Materials' },
  { symbol: '2222', name: 'Saudi Aramco', price: 36.70, change: 0.20, changePercent: 0.55, currency: 'SAR', market: 'tadawul', sector: 'Energy' },
  { symbol: '7010', name: 'Saudi Telecom', price: 41.20, change: -0.29, changePercent: -0.71, currency: 'SAR', market: 'tadawul', sector: 'Telecom' },
];

const sampleResult = (warning?: string): Sourced<Quote[]> => ({
  data: SAMPLE,
  source: 'sample',
  ...(warning ? { warning } : {}),
});

interface VendorQuote {
  symbol?: string;
  name?: string;
  close?: string;
  change?: string;
  percent_change?: string;
  currency?: string;
  volume?: string;
  status?: string;
  message?: string;
}

const toQuote = (raw: VendorQuote, requested: string): Quote | null => {
  const price = Number(raw.close);
  if (!Number.isFinite(price)) return null;

  const symbol = raw.symbol ?? requested;
  return {
    symbol,
    name: raw.name ?? symbol,
    price,
    change: Number(raw.change) || 0,
    changePercent: Number(raw.percent_change) || 0,
    currency: raw.currency ?? (isTadawul(symbol) ? 'SAR' : 'USD'),
    market: isTadawul(symbol) ? 'tadawul' : 'us',
    ...(Number.isFinite(Number(raw.volume)) ? { volume: Number(raw.volume) } : {}),
  };
};

async function fetchLiveQuotes(symbols: string[]): Promise<Quote[]> {
  const url = new URL('/quote', marketDataConfig.baseUrl);
  url.searchParams.set('symbol', symbols.map(vendorSymbol).join(','));
  url.searchParams.set('apikey', marketDataConfig.apiKey!);

  const response = await fetch(url, {
    // Bounded so a slow vendor cannot hold a request open indefinitely.
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: marketDataConfig.cacheSeconds },
  });

  if (!response.ok) {
    throw new Error(`market data provider returned ${response.status}`);
  }

  const body = await response.json();

  // One symbol comes back bare; several come back keyed by symbol.
  const entries: Array<[string, VendorQuote]> =
    symbols.length === 1 ? [[symbols[0], body]] : Object.entries(body ?? {});

  const quotes = entries
    .map(([requested, raw]) => toQuote(raw ?? {}, requested))
    .filter((quote): quote is Quote => quote !== null);

  if (quotes.length === 0) {
    // The vendor reports quota and key errors in the body, not the status.
    const message = (body as VendorQuote)?.message;
    throw new Error(message ? `market data provider: ${message}` : 'market data provider returned no usable quotes');
  }

  return quotes;
}

/**
 * Quotes for the given symbols, or the default watchlist when none are named.
 * Never throws: a live failure degrades to sample data carrying a warning.
 */
export async function getQuotes(symbols?: string[]): Promise<Sourced<Quote[]>> {
  const wanted = symbols?.length ? symbols : SAMPLE.map((quote) => quote.symbol);

  if (!integrations.marketData()) {
    return sampleResult();
  }

  try {
    return { data: await fetchLiveQuotes(wanted), source: 'live' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    return sampleResult(`Live market data unavailable (${reason}); showing sample prices.`);
  }
}

/** Tadawul listings only. */
export async function getTadawulQuotes(): Promise<Sourced<Quote[]>> {
  const symbols = SAMPLE.filter((quote) => quote.market === 'tadawul').map((quote) => quote.symbol);
  const result = await getQuotes(symbols);
  return { ...result, data: result.data.filter((quote) => quote.market === 'tadawul') };
}

/** Case-insensitive match on symbol or name. */
export async function searchQuotes(query: string | null): Promise<Sourced<Quote[]>> {
  const result = await getQuotes();
  if (!query) return result;

  const needle = query.toLowerCase();
  return {
    ...result,
    data: result.data.filter(
      (quote) =>
        quote.symbol.toLowerCase().includes(needle) || quote.name.toLowerCase().includes(needle),
    ),
  };
}
