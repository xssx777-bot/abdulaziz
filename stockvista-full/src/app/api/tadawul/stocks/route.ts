import { NextResponse } from 'next/server';
import { getTadawulQuotes } from '@/lib/providers/marketData';

export async function GET() {
  const { data, source, warning } = await getTadawulQuotes();

  return NextResponse.json({ stocks: data, source, ...(warning ? { warning } : {}) });
}
