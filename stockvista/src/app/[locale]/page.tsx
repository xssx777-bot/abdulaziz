'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Chart from '@/components/Chart';
import { translations, Locale } from '@/lib/i18n';

export default function Home() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'en';
  const t = translations[locale] || translations.en;

  const [market, setMarket] = useState<'US' | 'SA'>('US');
  const [symbol, setSymbol] = useState('AAPL');
  const [chartData, setChartData] = useState<any[]>([]);
  const [quote, setQuote] = useState({ price: 0, change: 0, changePercent: 0 });
  const [loading, setLoading] = useState(true);

  const usStocks = ['AAPL', 'SPY', 'GC=F', 'BTC-USD', 'MSFT', 'TSLA'];
  const saudiStocks = ['2222', '1120', '2010', '1180', '2080', '7203'];

  const getLabel = (s: string) => ({
    AAPL: 'Apple',
    SPY: 'S&P 500',
    'GC=F': 'Gold',
    'BTC-USD': 'Bitcoin',
    MSFT: 'Microsoft',
    TSLA: 'Tesla',
    '2222': 'أرامكو',
    '1120': 'الراجحي',
    '2010': 'سابك',
    '1180': 'الأهلي',
    '2080': 'معادن',
    '7203': 'إعمار',
  }[s] || s);

  const fetchData = async (sym: string, mkt: 'US' | 'SA') => {
    setLoading(true);
    try {
      const endpoint = mkt === 'US' ? '/api/stock' : '/api/tadawul';
      const res = await fetch(`${endpoint}?symbol=${sym}&resolution=D`);
      const data = await res.json();

      if (!data.error) {
        setChartData(data.candles || []);
        setQuote({
          price: data.quote?.price || 0,
          change: data.quote?.change || 0,
          changePercent: data.quote?.changePercent || 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(symbol, market);
  }, []);

  const handleSelect = (s: string) => {
    setSymbol(s);
    fetchData(s, market);
  };

  const handleMarket = (m: 'US' | 'SA') => {
    setMarket(m);
    const def = m === 'US' ? 'AAPL' : '2222';
    setSymbol(def);
    fetchData(def, m);
  };

  const isPositive = quote.change >= 0;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <div className="flex bg-gray-200 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-300 dark:border-gray-700">
            <button
              onClick={() => handleMarket('US')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                market === 'US' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              🇺🇸 {locale === 'ar' ? 'السوق الأمريكي' : 'US Market'}
            </button>
            <button
              onClick={() => handleMarket('SA')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                market === 'SA' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-700 dark:text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              🇸🇦 {locale === 'ar' ? 'السوق السعودي' : 'Saudi Market'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white/70 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700/50">
          <span className="text-2xl font-bold">{getLabel(symbol)}</span>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{symbol}</span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              market === 'US' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'bg-green-500/20 text-green-600 dark:text-green-300'
            }`}
          >
            {market === 'US' ? 'US' : 'تداول'}
          </span>
          <span className="text-3xl font-bold">${quote.price?.toFixed(2) || '---'}</span>
          <span className={`text-lg font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}
            {quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
          </span>
          {loading && <span className="text-gray-400 text-sm animate-pulse">{locale === 'ar' ? 'جاري التحديث...' : 'Loading...'}</span>}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(market === 'US' ? usStocks : saudiStocks).map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                symbol === s
                  ? market === 'US'
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-green-600 border-green-400 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
            >
              {getLabel(s)}
            </button>
          ))}
        </div>

        <div className="bg-white/70 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700/50 p-4 shadow-2xl">
          {loading && chartData.length === 0 ? (
            <div className="h-[500px] flex justify-center items-center text-gray-500">
              ⏳ {locale === 'ar' ? 'جاري تحميل البيانات...' : 'Loading chart...'}
            </div>
          ) : (
            <Chart data={chartData} />
          )}
        </div>

        <div className="mt-12 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-xl text-center text-sm text-gray-600 dark:text-gray-400">
          ⚠️ {t.disclaimer}
        </div>
      </div>
    </main>
  );
}
