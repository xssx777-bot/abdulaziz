'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Locale, translations } from '@/lib/i18n';

export default function WhaleTracker() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'en';
  const t = translations[locale] || translations.en;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [whales, setWhales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/login`);
    } else if (session?.user?.subscriptionTier === 'free') {
      router.push(`/${locale}/pricing`);
    }
  }, [status, session, locale, router]);

  useEffect(() => {
    if (session?.user?.subscriptionTier !== 'free' && status === 'authenticated') {
      fetchWhales();
      const interval = setInterval(fetchWhales, 60000);
      return () => clearInterval(interval);
    }
  }, [session, status]);

  const fetchWhales = async () => {
    try {
      const res = await fetch('/api/whale');
      const data = await res.json();
      setWhales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !session || session?.user?.subscriptionTier === 'free') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'جاري التحقق...' : 'Verifying access...'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
            🐋 {t.whaleTracker}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{t.whaleDescription}</p>
          <p className="text-sm text-gray-500 mt-2">{t.autoUpdates}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">{t.huntingForWhales}</p>
            </div>
          </div>
        ) : whales.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-xl mb-2">🦈 {t.noWhaleActivity}</p>
              <p className="text-sm">{locale === 'ar' ? 'جرب مرة أخرى لاحقاً' : 'Check back later'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {whales.map((whale, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.symbol}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{whale.symbol}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{locale === 'ar' ? 'نوع' : 'Type'}</p>
                    <p className={`text-lg font-bold ${whale.type === 'Call' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {whale.type}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{locale === 'ar' ? 'سعر التنفيذ' : 'Strike'}</p>
                    <p className="text-lg font-bold">${whale.strike}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{locale === 'ar' ? 'الحجم' : 'Volume'}</p>
                    <p className="text-lg font-bold">{whale.volume.toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.totalPremium}</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">${whale.totalPremium}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{locale === 'ar' ? 'المشاعر' : 'Sentiment'}</p>
                    <p className="text-sm font-semibold">{whale.sentiment}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  {locale === 'ar' ? 'الانتهاء: ' : 'Expires: '} {whale.expiration} | {locale === 'ar' ? 'آخر تحديث: ' : 'Last update: '} {new Date(whale.timestamp).toLocaleTimeString(locale)}
                </div>
              </div>
            ))}
          </div>
        )}

        {session?.user?.subscriptionTier === 'free' && (
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl">
            <p className="text-blue-900 dark:text-blue-200 mb-4">{t.upgradeForRealtime}</p>
          </div>
        )}
      </div>
    </main>
  );
}
