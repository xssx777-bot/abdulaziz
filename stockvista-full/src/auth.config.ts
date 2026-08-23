import type { NextAuthConfig } from 'next-auth';

// Edge-safe config: no Prisma, no bcrypt. Shared by middleware and the full
// auth setup in auth.ts, which adds the Credentials provider on top.
export const authConfig = {
  providers: [],
  pages: { signIn: '/en/auth/login' },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.subscriptionTier = (user as any).subscriptionTier;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.subscriptionTier = token.subscriptionTier as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
