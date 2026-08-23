import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAccounts } from '@/lib/providers/ibkr';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, source, warning } = await getAccounts();
  return NextResponse.json({ accounts: data, source, ...(warning ? { warning } : {}) });
}
