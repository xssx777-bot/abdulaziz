import type { DataSource } from '@/lib/config';

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  /** 'tadawul' for Saudi listings, 'us' otherwise. */
  market: 'tadawul' | 'us';
  sector?: string;
  volume?: number;
}

export interface Position {
  symbol: string;
  description: string;
  quantity: number;
  averageCost: number;
  marketPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  currency: string;
}

export interface BrokerAccount {
  id: string;
  alias?: string;
  currency: string;
  netLiquidation?: number;
}

/** Every provider response says where it came from, so the UI can label it. */
export interface Sourced<T> {
  data: T;
  source: DataSource;
  /** Present when a live call was attempted and failed. */
  warning?: string;
}
