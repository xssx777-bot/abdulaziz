import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPositions } from '@/lib/providers/ibkr';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accountId = new URL(req.url).searchParams.get('accountId');
  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
  }

  const { data, source, warning } = await getPositions(accountId);
  return NextResponse.json({ positions: data, source, ...(warning ? { warning } : {}) });
}
