'use client';
import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function Chart({ data }: { data: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: { background: { color: 'transparent' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#2d3748' }, horzLines: { color: '#2d3748' } },
      timeScale: { timeVisible: true },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
      wickUpColor: '#26a69a', wickDownColor: '#ef5350'
    });
    series.setData(data);

    const handleResize = () => chart.applyOptions({ width: containerRef.current?.clientWidth || 0 });
    window.addEventListener('resize', handleResize);

    return () => { window.removeEventListener('resize', handleResize); chart.remove(); };
  }, [data]);

  return <div ref={containerRef} className="w-full h-[400px] rounded-xl bg-gray-900/20 p-2" />;
}
