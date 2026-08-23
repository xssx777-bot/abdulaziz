'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  const t = translations[locale] || translations.en;
  const [chartData] = useState(generateMockData());

  return (
    <div>
      <h1 className="text-4xl font-bold mt-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t.title}</h1>
      <div className="mt-6 bg-gray-100 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
        <Chart data={chartData} />
      </div>
      <div className="mt-8 p-4 text-sm text-gray-500 dark:text-gray-400 border border-red-200 dark:border-red-500/20 rounded-xl text-center">
        ⚠️ {t.disclaimer}
      </div>
    </div>
  );
}
