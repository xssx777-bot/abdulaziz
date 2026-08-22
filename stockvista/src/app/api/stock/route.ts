import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';
  const resolution = searchParams.get('resolution') || 'D';
  const apiKey = process.env.FINNHUB_API_KEY;

  try {
    const today = Math.floor(Date.now() / 1000);
    const from = today - 60 * 60 * 24 * 120;

    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${today}&token=${apiKey}`;
    const candleRes = await fetch(candleUrl);
    const candleData = await candleRes.json();

    if (candleData.s === 'no_data') {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const quoteRes = await fetch(quoteUrl);
    const quoteData = await quoteRes.json();

    const formattedCandles = candleData.t.map((time: number, index: number) => ({
      time,
      open: candleData.o[index],
      high: candleData.h[index],
      low: candleData.l[index],
      close: candleData.c[index],
    }));

    return NextResponse.json({
      candles: formattedCandles,
      quote: {
        price: quoteData.c,
        change: quoteData.d,
        changePercent: quoteData.dp,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
