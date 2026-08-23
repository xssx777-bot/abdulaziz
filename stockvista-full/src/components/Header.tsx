'use client';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
      <Link href={`/${locale}`} className="text-2xl font-bold text-blue-600 dark:text-blue-400">📈 StockVista</Link>
      <nav className="flex gap-4 items-center">
        {session && (
          <>
            <Link href={`/${locale}/dashboard`} className="text-sm hover:text-blue-600">📊 Dashboard</Link>
            <Link href={`/${locale}/brokers`} className="text-sm hover:text-blue-600">🔗 Brokers</Link>
            <Link href={`/${locale}/options`} className="text-sm hover:text-blue-600">📋 Options</Link>
            <Link href={`/${locale}/whale-tracker`} className="text-sm hover:text-blue-600">🐋 Whales</Link>
          </>
        )}
        <button onClick={toggleTheme} className="text-xl">{mounted && (theme === 'dark' ? '☀️' : '🌙')}</button>
        {session ? (
          <>
            <Link href={`/${locale}/profile`} className="text-sm">👤 {session.user?.name || 'Profile'}</Link>
            <button onClick={() => signOut()} className="text-sm text-red-600 dark:text-red-400">Logout</button>
          </>
        ) : (
          <>
            <Link href={`/${locale}/auth/login`} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Login</Link>
            <Link href={`/${locale}/auth/register`} className="text-sm border px-3 py-1 rounded">Register</Link>
          </>
        )}
        <Link href={`/${locale === 'en' ? 'ar' : 'en'}`} className="text-sm border px-2 py-1 rounded">{locale === 'en' ? 'ع' : 'EN'}</Link>
      </nav>
    </header>
  );
}
