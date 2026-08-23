import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default async function middleware(req: any) {
  const session = await auth();
  const path = req.nextUrl.pathname;

  const protectedPaths = ['/dashboard', '/profile', '/brokers', '/options', '/whale-tracker'];
  const isProtected = protectedPaths.some(p => path.includes(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/en/auth/login', req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
