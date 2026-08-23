import { NextResponse } from 'next/server';

export async function GET() {
  const tadawulStocks = [
    { symbol: '1030', name: 'Al Rajhi Bank', price: 85.50, change: 1.20, sector: 'Banking' },
    { symbol: '2010', name: 'Saudi Basic Industries', price: 92.30, change: 0.80, sector: 'Chemicals' },
    { symbol: '2380', name: 'Saudi Aramco', price: 36.70, change: 2.10, sector: 'Energy' },
    { symbol: '1120', name: 'Al Inma Bank', price: 24.50, change: -0.50, sector: 'Banking' },
    { symbol: '1140', name: 'Banque Saudi Fransi', price: 28.30, change: 1.80, sector: 'Banking' },
  ];

  return NextResponse.json({ stocks: tadawulStocks });
}
