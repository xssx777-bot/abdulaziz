import { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Providers } from '@/providers/ThemeProvider';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockVista - Smart Trading Platform',
  description: 'Complete trading platform with real-time analytics and market data',
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const isArabic = params.locale === 'ar';

  return (
    <html lang={params.locale} dir={isArabic ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body>
        <Providers>
          <SessionProvider>
            <Header />
            <main className="max-w-7xl mx-auto p-4">{children}</main>
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
