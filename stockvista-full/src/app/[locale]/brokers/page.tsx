'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BrokersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [brokers, setBrokers] = useState([
    { id: 1, name: 'Interactive Brokers', status: 'connected', accounts: 1, lastSync: '5 minutes ago' },
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/auth/login`);
  }, [status, router, locale]);

  if (status === 'loading') return <div className="text-center mt-20">Loading...</div>;
  if (!session) return null;

  return (
    <div className="py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Connected Brokers</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your trading platform integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-bold mb-2">Add New Broker</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Connect a new trading account</p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
            Connect Broker
          </button>
        </div>

        {brokers.map((broker) => (
          <div key={broker.id} className="bg-white dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{broker.name}</h3>
                <span className="inline-block mt-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-bold">
                  ✓ {broker.status}
                </span>
              </div>
              <div className="text-2xl">📊</div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Connected Accounts</span>
                <span className="font-bold">{broker.accounts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
                <span className="font-bold">{broker.lastSync}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800">
                View Accounts
              </button>
              <button className="flex-1 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20">
                Disconnect
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">💡 Supported Brokers</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">We currently support the following brokers:</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
          <li>✅ Interactive Brokers (IBKR)</li>
          <li>✅ TD Ameritrade</li>
          <li>✅ E*TRADE</li>
          <li>✅ Charles Schwab</li>
        </ul>
      </div>
    </div>
  );
}
