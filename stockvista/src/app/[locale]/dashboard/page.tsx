'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { Locale, translations } from '@/lib/i18n';

export default function Dashboard() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'en';
  const t = translations[locale] || translations.en;
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/login`);
    }
  }, [status, locale, router]);

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          {t.dashboard}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{t.welcome}</p>
            <p className="text-2xl font-bold">{session.user?.name || session.user?.email}</p>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{locale === 'ar' ? 'الباقة الحالية' : 'Current Plan'}</p>
            <p className="text-2xl font-bold capitalize text-blue-600 dark:text-blue-400">
              {session.user?.subscriptionTier || 'free'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{locale === 'ar' ? 'تاريخ الانتهاء' : 'Expires'}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {session.user?.subscriptionExpiry ? new Date(session.user.subscriptionExpiry).toLocaleDateString(locale) : locale === 'ar' ? 'لا يوجد' : 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-green-200 dark:border-green-800/30 p-6">
            <h2 className="text-xl font-bold mb-4 text-green-700 dark:text-green-400">{t.portfolio}</h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>{t.totalValue}: <span className="font-bold text-gray-900 dark:text-white">$---</span></p>
              <p>{t.dailyPL}: <span className="font-bold text-green-600">+$---</span></p>
              <p>{t.totalReturn}: <span className="font-bold text-blue-600">+---%</span></p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-purple-200 dark:border-purple-800/30 p-6">
            <h2 className="text-xl font-bold mb-4 text-purple-700 dark:text-purple-400">{t.connectedBrokers}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.noBroker}</p>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition">
              {t.connectIBKR}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold mb-6">{t.positions}</h2>
          <div className="text-center py-12 text-gray-500">
            <p>📊 {locale === 'ar' ? 'لا توجد صفقات حالياً' : 'No positions yet'}</p>
          </div>
        </div>

        {session.user?.subscriptionTier === 'free' && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-2xl">
            <p className="text-blue-900 dark:text-blue-200 mb-4">{t.freeDelay}</p>
            <Link href={`/${locale}/pricing`} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-block transition">
              {t.upgradeNow}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
