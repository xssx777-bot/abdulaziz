import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';

// Uses the edge-safe config only — importing @/auth here would pull Prisma
// into the Edge runtime, which it does not support.
const { auth } = NextAuth(authConfig);

const protectedPaths = ['/dashboard', '/profile', '/brokers', '/options', '/whale-tracker'];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isProtected = protectedPaths.some(p => path.includes(p));

  if (isProtected && !req.auth) {
    const locale = path.split('/')[1] || 'en';
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
  }

  return NextResponse.next();
});

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
