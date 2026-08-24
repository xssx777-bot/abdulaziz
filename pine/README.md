# Pine Script strategies

TradingView strategies, written in Pine Script v6.

## `sma-crossover-strategy.pine` — "استراتيجيتي" (MA X-Over Pro)

A moving-average crossover system, gated by trend and momentum filters and
wrapped in a full risk-management layer. The trading idea is unchanged from the
original 14/28 SMA cross; everything around it — filters, exits, sizing — is
what turns it into something you can evaluate honestly.

### Architecture

The script runs one pass per bar, in a fixed order that keeps state consistent:

| # | Stage | What happens |
|---|-------|--------------|
| 1 | Reset | While flat, every latched level is cleared so a stale signal can't leak into the next trade. |
| 2 | Latch | On the first bar of a new position, entry price, stop, risk unit (`R`) and target are fixed from `strategy.position_avg_price`. |
| 3 | Manage | Break-even and trailing logic move the stop — never against the position. |
| 4 | Protect | `strategy.exit` is re-issued each bar under a stable ID, so the resting order tracks the updated stop. |
| 5 | Signal | Crossovers are evaluated; entries place their protective order in the same bar, so no position is ever unprotected. |

### Signal (① الإشارة)

- Six MA types (`SMA`, `EMA`, `WMA`, `RMA`, `HMA`, `VWMA`), a configurable price
  source, and independent fast/slow lengths — 14/28 by default.
- **Weak-cross filter**: a cross is ignored unless the gap between the averages
  is at least `gapMult × ATR`. This is what removes the cluster of marginal
  crosses a bare SMA system generates in sideways markets.

### Filters (② الفلاتر)

- **Direction**: both sides, long-only, or short-only.
- **Trend filter** (on by default): longs only above a 200-period MA, shorts only
  below it.
- **ADX filter** (off by default): requires `ADX ≥ adxMin` so the system stands
  aside in low-directionality regimes.
- **Reversal toggle**: when off, an opposite cross closes the position instead of
  flipping it. Note the trade-off — the strategy then sits flat until the *next*
  cross in the allowed direction.

### Risk management (③ إدارة المخاطر)

**Stop loss** — three bases, selectable:

| Mode | Placement |
|------|-----------|
| `نسبة مئوية` | Fixed percentage from entry. |
| `ATR` (default) | `atrMult × ATR` from entry — adapts to volatility. |
| `قمة/قاع سعري` | Beyond the lowest low / highest high of the last `swingLen` bars. |

Everything downstream is expressed in **R**, the initial stop distance:

- **Take profit** at `tpR × R` (default 2R).
- **Break-even** moves the stop to `beOffTicks` past entry once price reaches
  `beTrigR × R`. The offset defaults to 2 ticks so break-even is actually break-even
  after commission and slippage, not a small loss.
- **Trailing stop** activates at `trailStartR × R` and then follows at
  `trailMult × ATR` behind the close. Monotonic by construction — `math.max` for
  longs, `math.min` for shorts — so it can only ever tighten.

All levels are snapped with `math.round_to_mintick()`, so no order is ever
rejected for an off-tick price.

**Position sizing** — the default mode sizes each entry so that a stop-out costs
a fixed `riskPct` of equity:

```
qty = (equity × riskPct%) / (stopDistance × pointvalue)
```

capped at `maxLev × equity / close` so a very tight stop can't demand more
capital than the account has. `qtyStep` rounds the result down to a tradable
increment (`1` for shares), and `minQty` cancels the signal outright when the
result falls below what the instrument can trade — otherwise the order would be
silently rounded to zero and the trade would vanish with no trace in the report.
Switch the mode to `إعدادات المنصة` to hand sizing back to the Strategy
Properties tab instead.

### Backtest window (④) and display (⑤)

An optional date range confines trading to a chosen period and flattens any open
position when it ends — useful for keeping an out-of-sample segment clean. The
display section toggles the MAs, the live stop/target lines, and an info panel
showing state, entry, stop, target, size, and net profit.

### Order execution model

`process_orders_on_close = true` fills market orders at the close of the signal
bar rather than the next open, and `fill_orders_on_standard_ohlc = true` keeps
fills on standard candle prices so results stay honest on Heikin Ashi and other
derived chart types. Defaults include 0.05% commission and 2 ticks of slippage —
change them to match your broker before trusting any equity curve. `pyramiding`
is 0: one position at a time.

### Alerts

Every order carries an `alert_message` (`LONG`, `SHORT`, `EXIT LONG`,
`EXIT SHORT`, `CLOSE LONG`, `CLOSE SHORT`). Create one alert on the strategy and
use `{{strategy.order.alert_message}}` as the message body.

### Using it

1. Open a chart on [TradingView](https://www.tradingview.com/) and go to
   **Pine Editor**.
2. Paste the contents of `sma-crossover-strategy.pine`.
3. **Save**, then **Add to chart**.
4. Tune the inputs in the strategy settings and read the results in the
   **Strategy Tester** panel.

## Verification

`verify/simulate.py` re-implements the same state machine and risk arithmetic in
plain Python and runs it over synthetic price data, asserting the properties the
Pine script is supposed to guarantee:

1. A stop never moves against an open position.
2. Every bar of an open position is covered by a resting stop.
3. A stop-out never costs more than its risk budget.
4. The take profit sits exactly `tpR × R` from entry.
5. Size stays inside the leverage cap and above the minimum tradable quantity.
6. Every order level lands on the mintick grid.
7. One position at a time — no pyramiding.

```
$ python3 pine/verify/simulate.py
invariants held across 75 runs (15 configurations x 5 seeds x 4000 bars)

  entries              1203
  closed at stop       275
  closed at target     132
  closed by reversal   106
  skipped (qty guard)  667
  unprotected bars     0
  worst stop-out       102.9% of its risk budget
```

The worst stop-out exceeding 100% of budget is expected and correct: the budget
is measured at the stop price, and the fill lands two ticks beyond it.

**What this does and does not prove.** It exercises the logic — the ordering of
reset/latch/manage/protect/signal, the R arithmetic, the sizing formula, the
monotonicity of the trailing stop — across fifteen configurations and five
random seeds. It is not a Pine interpreter and says nothing about Pine syntax,
`ta.*` semantics, or TradingView's broker emulator. The harness was checked
against a deliberately broken trailing stop and caught the violation, so the
assertions are not vacuous.

### Caveats

- The script has not been compiled in TradingView — paste it into the Pine
  Editor to confirm before relying on it.
- Defaults are a starting point, not a tuned configuration. Optimize on one
  period and verify on another; the date-range input exists for exactly that.
- The equity cap on position size assumes a spot/CFD-style instrument where
  notional ≈ `qty × price`. For futures, size from contract specs instead.
- `VWMA` requires volume data and will error on symbols that don't provide it.

Licensed under the Mozilla Public License 2.0, per the header in the source file.
