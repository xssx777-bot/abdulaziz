import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default async function middleware(req: any) {
  const session = await auth();
  const path = req.nextUrl.pathname;

  if (path.includes('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/en/auth/login', req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
