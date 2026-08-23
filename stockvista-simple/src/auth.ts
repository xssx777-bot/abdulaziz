import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/auth.config';
import { normalizeEmail } from '@/lib/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [CredentialsProvider({
    name: 'credentials',
    credentials: { email: { type: 'email' }, password: { type: 'password' } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      // Same normalization as registration, or an address typed with
      // different capitalization will not match the stored row.
      const address = normalizeEmail(credentials.email as string);
      const user = await prisma.user.findUnique({ where: { email: address } });
      if (!user || !user.password) return null;
      const match = await bcrypt.compare(credentials.password as string, user.password);
      if (!match) return null;
      return { id: user.id, email: user.email, name: user.name, subscriptionTier: user.subscriptionTier };
    }
  })],
});
