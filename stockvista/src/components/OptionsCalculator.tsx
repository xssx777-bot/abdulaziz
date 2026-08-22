'use client';

import { useState } from 'react';
import { calculateBlackScholes, OptionsResult } from '@/lib/options';

export default function OptionsCalculator() {
  const [S, setS] = useState(100);
  const [K, setK] = useState(105);
  const [T, setT] = useState(30);
  const [r, setR] = useState(5);
  const [sigma, setSigma] = useState(20);
  const [result, setResult] = useState<OptionsResult | null>(null);

  const handleCalc = () => {
    const res = calculateBlackScholes(S, K, T / 365, r / 100, sigma / 100, 'call');
    setResult(res);
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
        ⚡ حاسبة عقود الخيارات (Black-Scholes)
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">سعر الأصل (S)</label>
          <input
            type="number"
            value={S}
            onChange={(e) => setS(Number(e.target.value))}
            className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">سعر التنفيذ (K)</label>
          <input
            type="number"
            value={K}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">الوقت (أيام)</label>
          <input
            type="number"
            value={T}
            onChange={(e) => setT(Number(e.target.value))}
            className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">الفائدة %</label>
          <input
            type="number"
            value={r}
            onChange={(e) => setR(Number(e.target.value))}
            className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">التقلب %</label>
          <input
            type="number"
            value={sigma}
            onChange={(e) => setSigma(Number(e.target.value))}
            className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleCalc}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold text-white transition"
          >
            حساب 🧮
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-100 dark:bg-gray-900/70 rounded-xl border border-gray-300 dark:border-gray-600">
          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm">سعر Call</span>
            <p className="text-green-600 dark:text-green-400 font-bold">${result.callPrice.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm">سعر Put</span>
            <p className="text-red-600 dark:text-red-400 font-bold">${result.putPrice.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm">دلتا (Δ)</span>
            <p className="text-blue-600 dark:text-blue-400">{result.delta.toFixed(4)}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm">جاما (Γ)</span>
            <p className="text-purple-600 dark:text-purple-400">{result.gamma.toFixed(4)}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm">ثيتا (Θ)</span>
            <p className="text-yellow-600 dark:text-yellow-400">{result.theta.toFixed(4)}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm">فيغا (V)</span>
            <p className="text-orange-600 dark:text-orange-400">{result.vega.toFixed(4)}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 text-sm">رو (ρ)</span>
            <p className="text-indigo-600 dark:text-indigo-400">{result.rho.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
