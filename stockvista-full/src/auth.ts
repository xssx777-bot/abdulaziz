import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [CredentialsProvider({
    name: 'credentials',
    credentials: { email: { type: 'email' }, password: { type: 'password' } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
      if (!user || !user.password) return null;
      const match = await bcrypt.compare(credentials.password as string, user.password);
      if (!match) return null;
      // Prisma models an absent name as null; NextAuth's User expects undefined.
      return { id: user.id, email: user.email, name: user.name ?? undefined, subscriptionTier: user.subscriptionTier };
    }
  })],
});
