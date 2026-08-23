import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/Header';
import './globals.css';

export default function RootLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const isArabic = params.locale === 'ar';
  return (
    <html lang={params.locale} dir={isArabic ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
        <ThemeProvider attribute="class">
          <SessionProvider>
            <Header />
            <main className="max-w-6xl mx-auto p-4">{children}</main>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
