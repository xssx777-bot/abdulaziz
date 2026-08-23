import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  const mockStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 180.5, change: 2.3 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.2, change: 1.8 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 380.1, change: 3.2 },
    { symbol: '1030', name: 'Al Rajhi Bank', price: 85.5, change: 1.2, market: 'tadawul' },
    { symbol: '2010', name: 'Saudi Basic Industries', price: 92.3, change: 0.8, market: 'tadawul' },
  ];

  const results = query
    ? mockStocks.filter(s => s.symbol.includes(query.toUpperCase()) || s.name.toLowerCase().includes(query.toLowerCase()))
    : mockStocks;

  return NextResponse.json({ results });
}
