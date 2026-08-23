'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Chart from '@/components/Chart';
import { translations, Locale } from '@/lib/i18n';

const generateMockData = () => {
  const data = [];
  let price = 150;
  for (let i = 0; i < 100; i++) {
    const time = Math.floor(Date.now() / 1000) - (100 - i) * 86400;
    const change = (Math.random() - 0.48) * 4;
    const open = price;
    const close = price + change;
    data.push({ time, open, high: Math.max(open, close) + 1, low: Math.min(open, close) - 1, close });
    price = close;
  }
  return data;
};

export default function Home() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'en';
  const { data: session } = useSession();
  const t = translations[locale] || translations.en;
  const [chartData] = useState(generateMockData());

  return (
    <div className="space-y-8 py-8">
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t.title}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">{t.tagline}</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-lg mb-2">📈 {t.realtimeData}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">Get live market data with minimal latency</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
          <h3 className="font-bold text-lg mb-2">🔗 {t.brokerIntegration}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">Connect your Interactive Brokers account directly</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
          <h3 className="font-bold text-lg mb-2">🐋 {t.whaleTracker}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">Track large trades and institutional activity</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
          <h3 className="font-bold text-lg mb-2">📊 {t.tadawulSupport}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">Full support for Saudi Arabia's Tadawul Market</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
          <h3 className="font-bold text-lg mb-2">📋 {t.optionsAnalysis}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">Advanced options calculator with Greek analysis</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 rounded-xl border border-indigo-200 dark:border-indigo-800">
          <h3 className="font-bold text-lg mb-2">📈 {t.advancedCharting}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">Professional-grade charting tools and analysis</p>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
        <Chart data={chartData} height={300} />
      </div>

      <div className="p-6 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <p className="text-red-700 dark:text-red-300">
          ⚠️ {t.disclaimer}
        </p>
      </div>

      {!session && (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to start trading?</h2>
          <div className="flex gap-4 justify-center">
            <Link href={`/${locale}/auth/register`} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
              Create Free Account
            </Link>
            <Link href={`/${locale}/pricing`} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-800">
              View Pricing
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
