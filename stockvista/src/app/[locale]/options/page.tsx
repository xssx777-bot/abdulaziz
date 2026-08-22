'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import OptionsCalculator from '@/components/OptionsCalculator';
import { Locale, translations } from '@/lib/i18n';
import Link from 'next/link';

export default function Options() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'en';
  const t = translations[locale] || translations.en;
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/login`);
    } else if (session?.user?.subscriptionTier === 'free') {
      router.push(`/${locale}/pricing`);
    }
  }, [status, session, locale, router]);

  if (status === 'loading' || !session || session?.user?.subscriptionTier === 'free') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{locale === 'ar' ? 'جاري التحقق...' : 'Verifying access...'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400">
            ⚡ {locale === 'ar' ? 'حاسبة عقود الخيارات' : 'Options Pricing'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {locale === 'ar'
              ? 'احسب أسعار الخيارات باستخدام نموذج Black-Scholes'
              : 'Calculate option prices using the Black-Scholes model'}
          </p>
        </div>

        <OptionsCalculator />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-4">{locale === 'ar' ? 'ما هي عقود الخيارات؟' : 'What are Options?'}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {locale === 'ar'
                ? 'عقد الخيار هو عقد يعطي المشتري الحق (لكن ليس الالتزام) بشراء أو بيع أصل معين بسعر محدد في تاريخ معين في المستقبل.'
                : 'An option is a contract that gives the buyer the right, but not the obligation, to buy or sell an underlying asset at a specific price on a future date.'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-4">{locale === 'ar' ? 'نموذج Black-Scholes' : 'Black-Scholes Model'}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {locale === 'ar'
                ? 'نموذج رياضي يستخدم لحساب سعر العقود الاختيارية بناءً على السعر الحالي والسعر المستهدف ووقت الاستحقاق والتقلب والفائدة.'
                : 'A mathematical formula for calculating the theoretical value of European-style options based on current price, strike price, time to expiration, volatility, and interest rate.'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-4">Greeks (اليونانيات)</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><strong>Delta (Δ):</strong> {locale === 'ar' ? 'حساسية السعر للتغيرات' : 'Price sensitivity to stock price changes'}</li>
              <li><strong>Gamma (Γ):</strong> {locale === 'ar' ? 'معدل تغير الدلتا' : 'Rate of change of delta'}</li>
              <li><strong>Theta (Θ):</strong> {locale === 'ar' ? 'تأثير مرور الوقت' : 'Time decay effect'}</li>
              <li><strong>Vega (V):</strong> {locale === 'ar' ? 'حساسية التقلب' : 'Volatility sensitivity'}</li>
              <li><strong>Rho (ρ):</strong> {locale === 'ar' ? 'حساسية الفائدة' : 'Interest rate sensitivity'}</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-700 p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-900 dark:text-blue-100">💡 {locale === 'ar' ? 'نصيحة' : 'Tips'}</h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• {locale === 'ar' ? 'استخدم هذه الآلة الحاسبة لفهم تسعير الخيارات بشكل أفضل' : 'Use this calculator to better understand option pricing'}</li>
              <li>• {locale === 'ar' ? 'تذكر أن هذا نموذج نظري فقط' : 'Remember this is a theoretical model only'}</li>
              <li>• {locale === 'ar' ? 'الأسواق الحقيقية قد تختلف عن النتائج' : 'Real market prices may differ from results'}</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
