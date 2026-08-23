import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { preferences: true, stripeCustomer: true }
  });

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { name: data.name, phone: data.phone, language: data.language }
  });

  return NextResponse.json(user);
}
