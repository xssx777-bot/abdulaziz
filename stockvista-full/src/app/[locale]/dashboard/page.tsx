'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Chart from '@/components/Chart';

const generateMockData = () => {
  const data = [];
  let price = 100;
  for (let i = 0; i < 50; i++) {
    const time = Math.floor(Date.now() / 1000) - (50 - i) * 3600;
    const change = (Math.random() - 0.48) * 2;
    const open = price;
    const close = price + change;
    data.push({ time, open, high: Math.max(open, close) + 0.5, low: Math.min(open, close) - 0.5, close });
    price = close;
  }
  return data;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [chartData] = useState(generateMockData());

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/auth/login`);
  }, [status, router, locale]);

  if (status === 'loading') return <div className="text-center mt-20 text-lg">Loading...</div>;
  if (!session) return null;

  return (
    <div className="space-y-6 py-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Welcome back, {session.user?.name || session.user?.email}! 👋</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's your trading dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Portfolio Value</p>
          <p className="text-3xl font-bold mt-2">$45,230.75</p>
          <p className="text-green-600 dark:text-green-400 text-sm mt-1">+2.5% this month</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Today's P&L</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">+$1,240.50</p>
          <p className="text-sm mt-1">+2.8% daily return</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active Positions</p>
          <p className="text-3xl font-bold mt-2">8</p>
          <p className="text-sm mt-1">3 bullish, 5 neutral</p>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Account Tier</p>
          <p className="text-3xl font-bold mt-2">Free</p>
          <p className="text-sm mt-1">Upgrade to unlock all features</p>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Portfolio Performance</h2>
        <Chart data={chartData} height={350} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4">Top Holdings</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <span className="font-bold">AAPL</span>
              <span className="text-green-600 dark:text-green-400">+3.2%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <span className="font-bold">MSFT</span>
              <span className="text-green-600 dark:text-green-400">+1.8%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
              <span className="font-bold">GOOGL</span>
              <span className="text-red-600 dark:text-red-400">-0.5%</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="font-bold text-green-700 dark:text-green-300">✅ Bought 10 AAPL</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">2 hours ago</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-bold text-blue-700 dark:text-blue-300">📊 Viewed MSFT analysis</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">5 hours ago</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="font-bold text-purple-700 dark:text-purple-300">🔗 Connected IBKR account</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
