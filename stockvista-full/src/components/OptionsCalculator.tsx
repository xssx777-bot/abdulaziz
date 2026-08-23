'use client';
import { useState } from 'react';
import { calculateBlackScholesCall, calculateBlackScholesPut } from '@/lib/options';

export default function OptionsCalculator() {
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [spotPrice, setSpotPrice] = useState(100);
  const [strikePrice, setStrikePrice] = useState(100);
  const [timeToExpiry, setTimeToExpiry] = useState(0.25);
  const [riskFreeRate, setRiskFreeRate] = useState(0.05);
  const [volatility, setVolatility] = useState(0.2);
  const [dividendYield, setDividendYield] = useState(0);

  const result = optionType === 'call'
    ? calculateBlackScholesCall({ spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield })
    : calculateBlackScholesPut({ spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield });

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4">Black-Scholes Options Calculator</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Option Type</label>
          <select value={optionType} onChange={(e) => setOptionType(e.target.value as 'call' | 'put')} className="w-full p-2 border rounded dark:bg-gray-900">
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Spot Price: ${spotPrice.toFixed(2)}</label>
          <input type="range" min="1" max="500" step="1" value={spotPrice} onChange={(e) => setSpotPrice(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Strike Price: ${strikePrice.toFixed(2)}</label>
          <input type="range" min="1" max="500" step="1" value={strikePrice} onChange={(e) => setStrikePrice(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Time to Expiry (years): {timeToExpiry.toFixed(2)}</label>
          <input type="range" min="0.01" max="2" step="0.01" value={timeToExpiry} onChange={(e) => setTimeToExpiry(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Risk-Free Rate: {(riskFreeRate * 100).toFixed(2)}%</label>
          <input type="range" min="0" max="0.1" step="0.001" value={riskFreeRate} onChange={(e) => setRiskFreeRate(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Volatility: {(volatility * 100).toFixed(2)}%</label>
          <input type="range" min="0.01" max="2" step="0.01" value={volatility} onChange={(e) => setVolatility(Number(e.target.value))} className="w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dividend Yield: {(dividendYield * 100).toFixed(2)}%</label>
          <input type="range" min="0" max="0.1" step="0.001" value={dividendYield} onChange={(e) => setDividendYield(Number(e.target.value))} className="w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Price</p>
          <p className="text-2xl font-bold">${(optionType === 'call' ? result.callPrice : result.putPrice).toFixed(2)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Delta</p>
          <p className="text-2xl font-bold">{result.greeks.delta.toFixed(4)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Theta</p>
          <p className="text-2xl font-bold">{result.greeks.theta.toFixed(4)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Gamma</p>
          <p className="text-2xl font-bold">{result.greeks.gamma.toFixed(6)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Vega</p>
          <p className="text-2xl font-bold">{result.greeks.vega.toFixed(4)}</p>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Rho</p>
          <p className="text-2xl font-bold">{result.greeks.rho.toFixed(4)}</p>
        </div>
      </div>
    </div>
  );
}
