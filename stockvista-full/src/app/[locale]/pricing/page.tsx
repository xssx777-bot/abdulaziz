'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PricingPage() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = params.locale as string;

  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: ['Basic chart analysis', 'Stock search', '5 watchlists', 'Community support'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      features: ['Advanced charting', 'IBKR integration', '50 watchlists', 'Priority support', 'Options calculator', 'Email alerts'],
      cta: 'Upgrade to Pro',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '$99',
      period: '/month',
      features: ['All Pro features', 'Whale tracker', 'Tadawul market data', 'API access', 'Custom alerts', '24/7 phone support'],
      cta: 'Upgrade to Premium',
      highlighted: false,
    },
  ];

  return (
    <div className="py-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Choose the plan that fits your trading needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border-2 p-8 space-y-6 transition-transform hover:scale-105 ${
              plan.highlighted
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/30'
            }`}
          >
            {plan.highlighted && (
              <div className="text-center">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">MOST POPULAR</span>
              </div>
            )}

            <div>
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="text-4xl font-bold mt-2">
                {plan.price}
                <span className="text-lg text-gray-600 dark:text-gray-400">{plan.period}</span>
              </p>
            </div>

            <ul className="space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {session ? (
              <Link
                href={`/${locale}/dashboard`}
                className={`block w-full text-center py-3 rounded-lg font-bold transition-colors ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {plan.cta}
              </Link>
            ) : (
              <Link
                href={`/${locale}/auth/register`}
                className={`block w-full text-center py-3 rounded-lg font-bold transition-colors ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-12">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-700 dark:text-gray-300">Yes, you can cancel your subscription at any time with no cancellation fees.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Do you offer refunds?</h3>
            <p className="text-gray-700 dark:text-gray-300">We offer a 7-day money-back guarantee if you're not satisfied with your plan.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Can I upgrade or downgrade?</h3>
            <p className="text-gray-700 dark:text-gray-300">You can change your plan anytime, and we'll prorate any charges or credits.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-700 dark:text-gray-300">We accept all major credit cards, PayPal, and bank transfers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
