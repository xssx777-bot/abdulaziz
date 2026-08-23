'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    if (status === 'unauthenticated') router.push(`/${locale}/auth/login`);
  }, [status, router, locale]);

  if (status === 'loading') return <div className="text-center mt-20">Loading...</div>;
  if (!session) return null;

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-bold">Welcome back, {session.user?.name || session.user?.email} 👋</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">Total Value</p>
          <p className="text-2xl font-bold">$45,230.75</p>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">Today's P&L</p>
          <p className="text-2xl font-bold text-green-600">+$1,240.50</p>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">Positions</p>
          <p className="text-2xl font-bold">4</p>
        </div>
      </div>
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <li>✅ Logged in</li>
          <li>📊 Viewed dashboard</li>
          <li>🔍 Searched AAPL</li>
        </ul>
      </div>
    </div>
  );
}
