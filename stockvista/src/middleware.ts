import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/profile'];

export default async function middleware(req: NextRequest) {
  const session = await auth();
  const pathname = req.nextUrl.pathname;
  const locale = pathname.split('/')[1] || 'en';

  if (protectedRoutes.some(route => pathname.includes(route)) && !session) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
  }

  if (pathname.includes('/whale-tracker') || pathname.includes('/options')) {
    if (!session) return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
    const tier = session.user?.subscriptionTier || 'free';
    if (tier === 'free') return NextResponse.redirect(new URL(`/${locale}/pricing`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
