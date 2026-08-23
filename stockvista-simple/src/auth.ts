import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [CredentialsProvider({
    name: 'credentials',
    credentials: { email: { type: 'email' }, password: { type: 'password' } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
      if (!user || !user.password) return null;
      const match = await bcrypt.compare(credentials.password as string, user.password);
      if (!match) return null;
      return { id: user.id, email: user.email, name: user.name, subscriptionTier: user.subscriptionTier };
    }
  })],
  callbacks: {
    async jwt({ token, user }) { if (user) token.subscriptionTier = user.subscriptionTier; return token; },
    async session({ session, token }) { if (session.user) session.user.subscriptionTier = token.subscriptionTier as string; return session; }
  },
  pages: { signIn: '/en/auth/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
});
