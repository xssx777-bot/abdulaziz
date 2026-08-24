# Pine Script strategies

TradingView strategies, written in Pine Script v6.

## `sma-crossover-strategy.pine` — "استراتيجيتي"

A simple SMA crossover system on the chart's current timeframe:

- **Long** when the 14-period SMA of `close` crosses **above** the 28-period SMA.
- **Short** when the 14-period SMA of `close` crosses **below** the 28-period SMA.

Because both sides use `strategy.entry`, each signal reverses the open position
rather than adding to it — after the first crossover the strategy is long or
short until the stop below takes it out.

`fill_orders_on_standard_ohlc = true` forces orders to fill at standard candle
prices, so backtests stay realistic on Heikin Ashi and other derived chart types.

### Stop loss

Each position carries a percentage stop, exposed as the **وقف الخسارة (%)** input
and defaulting to `2.0`. The stop sits `stopLossPerc` below the average entry
price for longs and the same distance above it for shorts, and is re-submitted
on every bar the position is open, so it tracks the average price if an entry is
ever filled in parts. Setting the input to `0` disables the stop entirely and
restores the original always-in-the-market behavior.

The active stop level is drawn on the chart as a red line, broken while flat.

Note that the stop is fixed at entry, not trailing, and that an opposite
crossover still reverses the position on its own — whichever comes first wins.

There is no take profit or position sizing beyond TradingView's default strategy
properties. Set order size, commission, and slippage under
**Strategy Tester → Settings → Properties** before reading any backtest result.

### Using it

1. Open a chart on [TradingView](https://www.tradingview.com/) and go to
   **Pine Editor**.
2. Paste the contents of `sma-crossover-strategy.pine`.
3. **Save**, then **Add to chart**.
4. Review results in the **Strategy Tester** panel.

Licensed under the Mozilla Public License 2.0, per the header in the source file.
