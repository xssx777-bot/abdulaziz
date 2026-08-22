import 'next-auth';

declare module 'next-auth' {
  interface User {
    subscriptionTier: string;
    subscriptionExpiry: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      subscriptionTier: string;
      subscriptionExpiry: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    subscriptionTier: string;
    subscriptionExpiry: string | null;
  }
}
