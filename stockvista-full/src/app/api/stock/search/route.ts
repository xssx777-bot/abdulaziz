import { NextResponse } from 'next/server';
import { searchQuotes } from '@/lib/providers/marketData';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { data, source, warning } = await searchQuotes(searchParams.get('q'));

  return NextResponse.json({ results: data, source, ...(warning ? { warning } : {}) });
}
