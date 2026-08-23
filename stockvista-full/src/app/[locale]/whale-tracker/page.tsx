'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WhaleTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [transactions] = useState([
    { id: 1, symbol: 'AAPL', quantity: '500,000', price: 180.5, type: 'BUY', exchange: 'NASDAQ', time: '2 hours ago', value: '$90.25M' },
    { id: 2, symbol: 'MSFT', quantity: '250,000', price: 380.1, type: 'SELL', exchange: 'NASDAQ', time: '4 hours ago', value: '$95.02M' },
    { id: 3, symbol: 'GOOGL', quantity: '100,000', price: 140.2, type: 'BUY', exchange: 'NASDAQ', time: '6 hours ago', value: '$14.02M' },
    { id: 4, symbol: 'TSLA', quantity: '75,000', price: 245.3, type: 'BUY', exchange: 'NASDAQ', time: '8 hours ago', value: '$18.39M' },
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/auth/login`);
  }, [status, router, locale]);

  if (status === 'loading') return <div className="text-center mt-20">Loading...</div>;
  if (!session) return null;

  return (
    <div className="py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Whale Tracker 🐋</h1>
        <p className="text-gray-600 dark:text-gray-400">Track large institutional trades in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Total Volume (24h)</p>
          <p className="text-2xl font-bold mt-2">$217.68B</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Largest Trade</p>
          <p className="text-2xl font-bold mt-2">$95.02M</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Transactions</p>
          <p className="text-2xl font-bold mt-2">1,247</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Tracked Accounts</p>
          <p className="text-2xl font-bold mt-2">342</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Recent Large Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-bold">Symbol</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Price</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Value</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-4 font-bold">{tx.symbol}</td>
                  <td className="px-6 py-4">{tx.quantity}</td>
                  <td className="px-6 py-4">${tx.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">{tx.value}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
