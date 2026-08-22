import { NextResponse } from 'next/server';

const SAUDI_MAP: Record<string, string> = {
  '2222': '2222.SR',
  '1120': '1120.SR',
  '1180': '1180.SR',
  '2010': '2010.SR',
  '2080': '2080.SR',
  '7203': '7203.SR',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get('symbol') || '2222';
  const finnhubSymbol = SAUDI_MAP[rawSymbol] || `${rawSymbol}.SR`;
  const apiKey = process.env.FINNHUB_API_KEY;

  try {
    if (apiKey && apiKey !== 'demo') {
      const today = Math.floor(Date.now() / 1000);
      const from = today - 60 * 60 * 24 * 120;

      const candleRes = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=D&from=${from}&to=${today}&token=${apiKey}`
      );
      const candleData = await candleRes.json();

      if (candleData.s !== 'no_data' && candleData.t) {
        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${apiKey}`);
        const quoteData = await quoteRes.json();

        const candles = candleData.t.map((t: number, i: number) => ({
          time: t,
          open: candleData.o[i],
          high: candleData.h[i],
          low: candleData.l[i],
          close: candleData.c[i],
        }));

        return NextResponse.json({
          candles,
          quote: {
            price: quoteData.c || candles[candles.length - 1]?.close || 0,
            change: quoteData.d || 0,
            changePercent: quoteData.dp || 0,
          },
          market: 'SA',
          source: 'finnhub',
        });
      }
    }

    // Fallback simulation
    const basePrices: Record<string, number> = {
      '2222': 32.5,
      '1120': 82,
      '1180': 38.5,
      '2010': 120,
      '2080': 45,
      '7203': 20,
    };

    let price = basePrices[rawSymbol] || 50;
    const data = [];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
      const time = new Date(now);
      time.setDate(time.getDate() - (100 - i));
      if (time.getDay() === 0 || time.getDay() === 6) continue;

      const change = (Math.random() - 0.48) * 1.2;
      const open = price;
      const close = price + change;

      data.push({
        time: Math.floor(time.getTime() / 1000),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat((Math.max(open, close) + Math.random() * 1).toFixed(2)),
        low: parseFloat((Math.min(open, close) - Math.random() * 1).toFixed(2)),
        close: parseFloat(close.toFixed(2)),
      });

      price = close;
    }

    const last = data[data.length - 1];
    const prev = data[data.length - 2];

    return NextResponse.json({
      candles: data,
      quote: {
        price: last?.close || 0,
        change: prev ? parseFloat((last.close - prev.close).toFixed(2)) : 0,
        changePercent: prev && prev.close !== 0 ? parseFloat((((last.close - prev.close) / prev.close) * 100).toFixed(2)) : 0,
      },
      market: 'SA',
      source: 'simulation',
    });
  } catch (e) {
    return NextResponse.json(
      {
        candles: [],
        quote: { price: 0, change: 0, changePercent: 0 },
        market: 'SA',
        source: 'error',
      }
    );
  }
}
