import { NextResponse } from 'next/server';

export async function GET() {
  const whaleTransactions = [
    { id: '1', symbol: 'AAPL', quantity: 500000, price: 180.5, type: 'BUY', exchange: 'NASDAQ', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: '2', symbol: 'MSFT', quantity: 250000, price: 380.1, type: 'SELL', exchange: 'NASDAQ', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    { id: '3', symbol: 'GOOGL', quantity: 100000, price: 140.2, type: 'BUY', exchange: 'NASDAQ', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  ];

  return NextResponse.json({ transactions: whaleTransactions });
}
