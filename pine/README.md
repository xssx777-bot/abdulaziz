# Pine Script strategies

TradingView strategies, written in Pine Script v6.

## `sma-crossover-strategy.pine` — "استراتيجيتي"

A simple always-in-the-market SMA crossover system on the chart's current
timeframe:

- **Long** when the 14-period SMA of `close` crosses **above** the 28-period SMA.
- **Short** when the 14-period SMA of `close` crosses **below** the 28-period SMA.

Because both sides use `strategy.entry`, each signal reverses the open position
rather than adding to it — the strategy is always either long or short after the
first crossover.

`fill_orders_on_standard_ohlc = true` forces orders to fill at standard candle
prices, so backtests stay realistic on Heikin Ashi and other derived chart types.

There is no stop loss, take profit, or position sizing beyond TradingView's
default strategy properties. Set order size, commission, and slippage under
**Strategy Tester → Settings → Properties** before reading any backtest result.

### Using it

1. Open a chart on [TradingView](https://www.tradingview.com/) and go to
   **Pine Editor**.
2. Paste the contents of `sma-crossover-strategy.pine`.
3. **Save**, then **Add to chart**.
4. Review results in the **Strategy Tester** panel.

Licensed under the Mozilla Public License 2.0, per the header in the source file.
