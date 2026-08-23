import { ibkrConfig, integrations } from '@/lib/config';
import type { BrokerAccount, Position, Sourced } from './types';

/**
 * Interactive Brokers, via the Client Portal Web API.
 *
 * Worth knowing before wiring this up: IBKR has no cloud REST endpoint you can
 * point an API key at. The Client Portal API is served by a gateway you run and
 * authenticate against interactively — a person logs in through the gateway's
 * browser flow, and the session it mints is what these calls ride on. So
 * IBKR_GATEWAY_URL points at that gateway, and there is no key to configure;
 * "connected" means the gateway is up and its session is live.
 *
 * The practical consequence: this cannot authenticate a user on its own. A
 * deployment needs one gateway per account, kept logged in. That is an
 * operational decision, not something this module can paper over — so when the
 * gateway is absent or its session has lapsed, the caller is told plainly.
 */

const SAMPLE_ACCOUNTS: BrokerAccount[] = [
  { id: 'U1234417', alias: 'Individual', currency: 'USD', netLiquidation: 45230.75 },
];

const SAMPLE_POSITIONS: Position[] = [
  { symbol: 'AAPL', description: 'Apple Inc.', quantity: 120, averageCost: 162.40, marketPrice: 178.42, marketValue: 21410.40, unrealizedPnl: 1922.40, currency: 'USD' },
  { symbol: 'MSFT', description: 'Microsoft Corp.', quantity: 40, averageCost: 352.10, marketPrice: 381.05, marketValue: 15242.00, unrealizedPnl: 1158.00, currency: 'USD' },
  { symbol: 'GOOGL', description: 'Alphabet Inc.', quantity: 65, averageCost: 145.90, marketPrice: 140.18, marketValue: 9111.70, unrealizedPnl: -371.80, currency: 'USD' },
];

async function gatewayFetch(path: string): Promise<unknown> {
  const response = await fetch(new URL(path, ibkrConfig.baseUrl), {
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (response.status === 401) {
    throw new Error('gateway session has lapsed — log in again at the Client Portal gateway');
  }
  if (!response.ok) {
    throw new Error(`gateway returned ${response.status}`);
  }
  return response.json();
}

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function getAccounts(): Promise<Sourced<BrokerAccount[]>> {
  if (!integrations.ibkr()) {
    return { data: SAMPLE_ACCOUNTS, source: 'sample' };
  }

  try {
    const raw = await gatewayFetch('/v1/api/portfolio/accounts');
    const accounts = (Array.isArray(raw) ? raw : []).map((entry): BrokerAccount => {
      const account = entry as Record<string, unknown>;
      return {
        id: String(account.accountId ?? account.id ?? ''),
        ...(account.accountAlias ? { alias: String(account.accountAlias) } : {}),
        currency: String(account.currency ?? 'USD'),
      };
    }).filter((account) => account.id);

    if (accounts.length === 0) throw new Error('gateway returned no accounts');
    return { data: accounts, source: 'live' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    return {
      data: SAMPLE_ACCOUNTS,
      source: 'sample',
      warning: `Interactive Brokers unavailable (${reason}); showing sample accounts.`,
    };
  }
}

export async function getPositions(accountId: string): Promise<Sourced<Position[]>> {
  if (!integrations.ibkr()) {
    return { data: SAMPLE_POSITIONS, source: 'sample' };
  }

  try {
    // Page 0; the gateway paginates positions at 30 per page.
    const raw = await gatewayFetch(`/v1/api/portfolio/${encodeURIComponent(accountId)}/positions/0`);
    const positions = (Array.isArray(raw) ? raw : []).map((entry): Position => {
      const row = entry as Record<string, unknown>;
      return {
        symbol: String(row.contractDesc ?? row.ticker ?? ''),
        description: String(row.name ?? row.contractDesc ?? ''),
        quantity: asNumber(row.position),
        averageCost: asNumber(row.avgCost),
        marketPrice: asNumber(row.mktPrice),
        marketValue: asNumber(row.mktValue),
        unrealizedPnl: asNumber(row.unrealizedPnl),
        currency: String(row.currency ?? 'USD'),
      };
    }).filter((position) => position.symbol);

    return { data: positions, source: 'live' };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    return {
      data: SAMPLE_POSITIONS,
      source: 'sample',
      warning: `Interactive Brokers unavailable (${reason}); showing sample positions.`,
    };
  }
}
