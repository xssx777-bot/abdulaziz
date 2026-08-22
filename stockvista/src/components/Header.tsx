'use client';

import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    if (!mounted) return '🌓';
    if (theme === 'light') return '☀️';
    if (theme === 'dark') return '🌙';
    return '🖥️';
  };

  const getLabel = () => {
    if (!mounted) return '...';
    if (theme === 'light') return locale === 'ar' ? 'فاتح' : 'Light';
    if (theme === 'dark') return locale === 'ar' ? 'داكن' : 'Dark';
    return locale === 'ar' ? 'النظام' : 'System';
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
        <Link href={`/${locale}`} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          StockVista
        </Link>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <Link
            href={`/${locale}/options`}
            className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm border border-gray-300 dark:border-gray-600 px-3 py-1 rounded transition"
          >
            {locale === 'ar' ? 'خيارات' : 'Options'}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm border border-gray-300 dark:border-gray-600 px-3 py-1 rounded transition"
          >
            {locale === 'ar' ? 'الباقات' : 'Pricing'}
          </Link>

          {session ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm border border-gray-300 dark:border-gray-600 px-3 py-1 rounded transition"
              >
                📊 {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </Link>
              <Link
                href={`/${locale}/whale-tracker`}
                className="text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 text-sm border border-purple-300 dark:border-purple-500/50 px-3 py-1 rounded bg-purple-50 dark:bg-purple-500/10 transition"
              >
                🐋 {locale === 'ar' ? 'الحيتان' : 'Whales'}
              </Link>
              <span className="text-xs bg-green-600 dark:bg-green-500 px-2 py-1 rounded-full text-white hidden sm:inline">
                {session.user?.subscriptionTier}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: `/${locale}` })}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm border border-red-300 dark:border-red-500/30 px-3 py-1 rounded transition"
              >
                {locale === 'ar' ? 'خروج' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/auth/login`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm transition"
              >
                {locale === 'ar' ? 'دخول' : 'Login'}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="border border-gray-400 dark:border-gray-500 hover:border-black dark:hover:border-white px-4 py-1.5 rounded text-sm transition text-gray-700 dark:text-gray-300"
              >
                {locale === 'ar' ? 'تسجيل' : 'Sign Up'}
              </Link>
            </>
          )}

          <button
            onClick={cycleTheme}
            className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full text-sm transition border border-gray-300 dark:border-gray-700"
            title={locale === 'ar' ? 'تبديل المظهر' : 'Toggle Theme'}
          >
            <span className="text-base">{getIcon()}</span>
            <span className="hidden sm:inline font-medium text-gray-800 dark:text-gray-200">{getLabel()}</span>
          </button>

          <Link
            href={`/${locale === 'en' ? 'ar' : 'en'}`}
            className="bg-gray-200 dark:bg-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            {locale === 'en' ? 'ع' : 'EN'}
          </Link>
        </div>
      </div>
    </header>
  );
}
