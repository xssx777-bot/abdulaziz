import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan } = await req.json();

  const planPrices = {
    pro: 'price_test_pro',
    premium: 'price_test_premium',
  };

  return NextResponse.json({
    success: true,
    message: 'Checkout session created',
    plan,
    priceId: planPrices[plan as keyof typeof planPrices] || 'price_test_pro'
  });
}
