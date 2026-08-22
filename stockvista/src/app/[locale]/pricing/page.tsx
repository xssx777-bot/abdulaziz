'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Locale, translations } from '@/lib/i18n';

export default function Pricing() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'en';
  const t = translations[locale] || translations.en;
  const { data: session } = useSession();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const plans = [
    {
      name: locale === 'ar' ? 'مجانية' : 'Free',
      price: locale === 'ar' ? 'مجاني' : 'Free',
      features: [
        locale === 'ar' ? 'بيانات متأخرة 15 دقيقة' : '15-min delayed data',
        locale === 'ar' ? 'أسهم أمريكية' : 'US stocks',
        locale === 'ar' ? 'أسهم سعودية' : 'Saudi stocks',
      ],
      tier: 'free',
      recommended: false,
    },
    {
      name: locale === 'ar' ? 'أساسية' : 'Basic',
      price: '$9.99',
      period: locale === 'ar' ? '/شهر' : '/month',
      features: [
        locale === 'ar' ? 'بيانات لحظية' : 'Real-time data',
        locale === 'ar' ? 'جميع الأسهم' : 'All stocks',
        locale === 'ar' ? 'حاسبة خيارات' : 'Options calculator',
      ],
      tier: 'basic',
      recommended: false,
    },
    {
      name: locale === 'ar' ? 'احترافية' : 'Pro',
      price: '$29.99',
      period: locale === 'ar' ? '/شهر' : '/month',
      features: [
        locale === 'ar' ? 'بيانات لحظية متقدمة' : 'Advanced real-time',
        locale === 'ar' ? 'كاشف الحيتان' : 'Whale tracker',
        locale === 'ar' ? 'ربط IBKR' : 'IBKR integration',
        locale === 'ar' ? 'إشعارات متقدمة' : 'Advanced alerts',
        locale === 'ar' ? 'تحليلات متقدمة' : 'Advanced analytics',
      ],
      tier: 'pro',
      recommended: true,
    },
  ];

  const handleUpgrade = async (tier: string) => {
    if (!session) {
      router.push(`/${locale}/auth/login`);
      return;
    }

    setUpgrading(tier);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (res.ok) {
        router.refresh();
        alert(locale === 'ar' ? 'تم التحديث بنجاح' : 'Upgraded successfully');
      }
    } catch (err) {
      alert(locale === 'ar' ? 'حدث خطأ' : 'Error occurred');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {locale === 'ar' ? 'الباقات والأسعار' : 'Plans & Pricing'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {locale === 'ar' ? 'اختر الباقة المناسبة لاحتياجاتك' : 'Choose the perfect plan for you'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-2xl border-2 p-8 transition transform hover:scale-105 ${
                plan.recommended
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 shadow-2xl'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
              }`}
            >
              {plan.recommended && (
                <div className="mb-4 inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  {locale === 'ar' ? 'الأفضل' : 'Most Popular'}
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span className="text-green-500">✓</span> {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.tier)}
                disabled={upgrading === plan.tier || session?.user?.subscriptionTier === plan.tier}
                className={`w-full py-3 rounded-lg font-bold transition ${
                  session?.user?.subscriptionTier === plan.tier
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : plan.recommended
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
              >
                {upgrading === plan.tier
                  ? locale === 'ar'
                    ? 'جاري التحديث...'
                    : 'Upgrading...'
                  : session?.user?.subscriptionTier === plan.tier
                  ? locale === 'ar'
                    ? 'الخطة الحالية'
                    : 'Current Plan'
                  : locale === 'ar'
                  ? 'اختر الخطة'
                  : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">{locale === 'ar' ? 'المميزات المتقدمة' : 'Advanced Features'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: locale === 'ar' ? 'بيانات لحظية' : 'Real-time Data', desc: locale === 'ar' ? 'بيانات محدثة بشكل فوري' : 'Live market updates' },
              { title: locale === 'ar' ? 'كاشف الحيتان' : 'Whale Tracker', desc: locale === 'ar' ? 'رصد الصفقات الضخمة' : 'Track massive trades' },
              { title: locale === 'ar' ? 'حاسبة خيارات' : 'Options Calculator', desc: locale === 'ar' ? 'حسابات Black-Scholes' : 'Advanced pricing' },
            ].map((feature, i) => (
              <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
