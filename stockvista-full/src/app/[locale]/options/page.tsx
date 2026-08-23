'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import OptionsCalculator from '@/components/OptionsCalculator';

export default function OptionsPage() {
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
    <div className="py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Options Calculator</h1>
        <p className="text-gray-600 dark:text-gray-400">Black-Scholes pricing and Greeks analysis</p>
      </div>

      <OptionsCalculator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">What is Delta?</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Delta represents the rate of change of the option price with respect to changes in the underlying asset price. A delta of 0.5 means the option price will move $0.50 for every $1 move in the stock.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">What is Theta?</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Theta measures the time decay of an option. It represents how much the option price will decrease per day as it approaches expiration, assuming all other factors remain constant.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">What is Vega?</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Vega measures the sensitivity of the option price to changes in volatility. A higher vega means the option price is more sensitive to changes in the underlying asset's volatility.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">What is Gamma?</h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Gamma measures the rate of change of delta with respect to changes in the underlying asset price. It tells you how much delta will change when the stock price moves $1.
          </p>
        </div>
      </div>
    </div>
  );
}
