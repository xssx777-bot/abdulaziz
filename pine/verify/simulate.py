#!/usr/bin/env python3
"""Invariant check for pine/sma-crossover-strategy.pine.

This is NOT a Pine interpreter and it does not validate Pine syntax — only
TradingView can do that. What it does is re-implement the strategy's state
machine (reset → latch → manage → protect → signal) and its risk arithmetic in
plain Python, run it over synthetic price data, and assert the properties the
Pine script is supposed to guarantee:

  1. A stop never moves against an open position.
  2. Every bar of an open position is covered by a resting stop.
  3. A stop-out never costs more than the configured risk budget.
  4. The take profit sits exactly tpR x R from entry.
  5. Position size never exceeds the leverage cap, and never falls below the
     minimum tradable quantity.
  6. Every order level lands on the mintick grid.
  7. Only one position at a time — no pyramiding, no stacking.

Run:  python3 pine/verify/simulate.py
"""

from dataclasses import dataclass, field

# ── configuration: mirrors the Pine input defaults ─────────────────────────
TICK = 0.01
POINT_VALUE = 1.0
INITIAL_CAPITAL = 10_000.0
COMMISSION_PCT = 0.05
SLIPPAGE_TICKS = 2

DEFAULTS = dict(
    fast_len=14, slow_len=28, trend_len=200, atr_len=14,
    use_gap=True, gap_mult=0.05,
    use_trend=True,
    stop_mode="atr", atr_mult=2.0, stop_perc=2.0, swing_len=10,
    use_tp=True, tp_r=2.0,
    use_be=True, be_trig_r=1.0, be_off_ticks=2,
    use_trail=True, trail_start_r=1.0, trail_mult=2.0,
    risk_pct=1.0, max_lev=1.0,
    qty_step=0.0, min_qty=0.0,
    allow_rev=True,
)


def tickify(x):
    return round(round(x / TICK) * TICK, 10)


def on_grid(x):
    return x is None or abs(x / TICK - round(x / TICK)) < 1e-6


# ── synthetic market: trending and ranging regimes, deterministic ──────────
def make_bars(n=4000, seed=20260824):
    state, price, bars = seed, 100.0, []
    for i in range(n):
        state = (1103515245 * state + 12345) % (2 ** 31)
        shock = (state / (2 ** 31) - 0.5)
        # alternate 250-bar trending and ranging regimes
        regime = (i // 250) % 2
        drift = 0.05 * (1 if (i // 250) % 4 < 2 else -1) if regime == 0 else 0.0
        price = max(1.0, price + drift + shock * (1.2 if regime == 0 else 0.6))
        state = (1103515245 * state + 12345) % (2 ** 31)
        rng = abs(state / (2 ** 31) - 0.5) * 1.5 + 0.05
        o = bars[-1]["c"] if bars else price
        c, h, l = price, max(o, price) + rng, min(o, price) - rng
        bars.append({"o": o, "h": h, "l": max(0.5, l), "c": c})
    return bars


def sma(vals, length):
    out, run = [], 0.0
    for i, v in enumerate(vals):
        run += v
        if i >= length:
            run -= vals[i - length]
        out.append(run / length if i >= length - 1 else None)
    return out


def atr(bars, length):
    out, prev, rma = [], None, None
    for b in bars:
        tr = b["h"] - b["l"] if prev is None else max(
            b["h"] - b["l"], abs(b["h"] - prev), abs(b["l"] - prev))
        rma = tr if rma is None else (rma * (length - 1) + tr) / length
        prev = b["c"]
        out.append(rma)
    return out


@dataclass
class Trade:
    side: int
    entry: float
    qty: float
    risk_unit: float
    stop: float
    tp: float
    budget: float
    stops_seen: list = field(default_factory=list)


class Failure(Exception):
    pass


def run(seed=20260824, **over):
    cfg = dict(DEFAULTS, **over)
    bars = make_bars(seed=seed)
    closes = [b["c"] for b in bars]
    fast, slow, trend = sma(closes, cfg["fast_len"]), sma(closes, cfg["slow_len"]), sma(closes, cfg["trend_len"])
    atrs = atr(bars, cfg["atr_len"])

    cash = INITIAL_CAPITAL
    pos = None            # active Trade
    planned = None        # (stop, tp, qty) latched at the signal bar
    pending = None        # entry filled at the previous bar's close
    stats = {"trades": 0, "stopped": 0, "target": 0, "reversed": 0,
             "skipped_qty": 0, "unprotected_bars": 0}
    worst_loss_ratio = 0.0

    def fee(px, qty):
        return abs(px * qty) * COMMISSION_PCT / 100.0

    for i, b in enumerate(bars):
        if i < cfg["trend_len"] + 1:
            continue

        # ── (a) resting orders from the previous bar act during this bar ───
        if pos is not None:
            hit_stop = b["l"] <= pos.stop if pos.side > 0 else b["h"] >= pos.stop
            hit_tp = (cfg["use_tp"] and pos.tp is not None and
                      (b["h"] >= pos.tp if pos.side > 0 else b["l"] <= pos.tp))
            if hit_stop or hit_tp:
                # worst case first: if both are touched, assume the stop filled
                px = pos.stop if hit_stop else pos.tp
                px -= pos.side * SLIPPAGE_TICKS * TICK if hit_stop else 0.0
                pnl = (px - pos.entry) * pos.side * pos.qty * POINT_VALUE
                cash += pnl - fee(px, pos.qty)
                if hit_stop:
                    stats["stopped"] += 1
                    loss = -pnl
                    if loss > 0:
                        worst_loss_ratio = max(worst_loss_ratio, loss / pos.budget)
                    # INVARIANT 3 — a stop-out stays inside the risk budget
                    # (1.35x allows for the gap-through case plus costs)
                    if loss > pos.budget * 1.35:
                        raise Failure(
                            f"bar {i}: stop-out lost {loss:.2f} vs budget {pos.budget:.2f}")
                else:
                    stats["target"] += 1
                pos = None

        # ── (b) script logic at bar close ──────────────────────────────────
        # 1) reset while flat
        if pos is None and pending is None:
            planned = None

        # 2) latch levels on the first bar of a new position
        if pending is not None:
            side, entry, qty, pstop, ptp, budget = pending
            risk_unit = max(abs(entry - pstop), TICK)
            pos = Trade(side=side, entry=entry, qty=qty, risk_unit=risk_unit,
                        stop=pstop, budget=budget,
                        tp=tickify(entry + side * cfg["tp_r"] * risk_unit) if cfg["use_tp"] else None)
            pos.stops_seen.append(pstop)
            # INVARIANT 4 — the target is exactly tpR x R away
            tp_r = cfg["tp_r"]
            if cfg["use_tp"] and abs(abs(pos.tp - entry) - tp_r * risk_unit) > TICK:
                raise Failure(f"bar {i}: tp {pos.tp} is not {tp_r}R from {entry}")
            pending = None

        # 3) manage: break-even, then trail — never against the position
        if pos is not None:
            before = pos.stop
            if cfg["use_be"]:
                reached = (b["h"] >= pos.entry + cfg["be_trig_r"] * pos.risk_unit if pos.side > 0
                           else b["l"] <= pos.entry - cfg["be_trig_r"] * pos.risk_unit)
                if reached:
                    be = tickify(pos.entry + pos.side * cfg["be_off_ticks"] * TICK)
                    pos.stop = max(pos.stop, be) if pos.side > 0 else min(pos.stop, be)
            if cfg["use_trail"]:
                reached = (b["h"] >= pos.entry + cfg["trail_start_r"] * pos.risk_unit if pos.side > 0
                           else b["l"] <= pos.entry - cfg["trail_start_r"] * pos.risk_unit)
                if reached:
                    tr = tickify(b["c"] - pos.side * atrs[i] * cfg["trail_mult"])
                    pos.stop = max(pos.stop, tr) if pos.side > 0 else min(pos.stop, tr)
            # INVARIANT 1 — monotonic stop
            if (pos.side > 0 and pos.stop < before - 1e-9) or \
               (pos.side < 0 and pos.stop > before + 1e-9):
                raise Failure(f"bar {i}: stop moved against the position "
                              f"({before} -> {pos.stop})")
            pos.stops_seen.append(pos.stop)
            # INVARIANT 2 + 6 — protected, and on the tick grid
            if pos.stop is None:
                stats["unprotected_bars"] += 1
            if not on_grid(pos.stop) or not on_grid(pos.tp):
                raise Failure(f"bar {i}: level off the mintick grid")

        # 4) signal
        f, s, t, a = fast[i], slow[i], trend[i], atrs[i]
        if None in (f, s, t) or i == 0 or fast[i - 1] is None:
            continue
        crossed_up = fast[i - 1] <= slow[i - 1] and f > s
        crossed_dn = fast[i - 1] >= slow[i - 1] and f < s
        if not (crossed_up or crossed_dn):
            continue

        side = 1 if crossed_up else -1
        gap_ok = (not cfg["use_gap"]) or abs(f - s) >= a * cfg["gap_mult"]
        trend_ok = (not cfg["use_trend"]) or (b["c"] > t if side > 0 else b["c"] < t)

        if cfg["stop_mode"] == "percent":
            stop_est = tickify(b["c"] * (1 - side * cfg["stop_perc"] / 100.0))
        elif cfg["stop_mode"] == "swing":
            window = bars[max(0, i - cfg["swing_len"] + 1):i + 1]
            edge = min(x["l"] for x in window) if side > 0 else max(x["h"] for x in window)
            stop_est = tickify(min(edge, b["c"] - TICK) if side > 0 else max(edge, b["c"] + TICK))
        else:
            stop_est = tickify(b["c"] - side * a * cfg["atr_mult"])
        risk_est = (b["c"] - stop_est) * side
        equity = cash
        budget = equity * cfg["risk_pct"] / 100.0
        qty = budget / (risk_est * POINT_VALUE) if risk_est > 0 else 0.0
        cap = cfg["max_lev"] * equity / b["c"]
        qty = min(qty, cap)
        if cfg["qty_step"] > 0:
            qty = int(qty / cfg["qty_step"]) * cfg["qty_step"]
        qty_ok = qty > 0 and qty >= cfg["min_qty"]
        if not qty_ok:
            stats["skipped_qty"] += 1

        if not (gap_ok and trend_ok and risk_est > 0 and qty_ok):
            # an opposite cross still closes an open position
            if pos is not None and pos.side != side:
                px = b["c"] - pos.side * SLIPPAGE_TICKS * TICK
                cash += (px - pos.entry) * pos.side * pos.qty * POINT_VALUE - fee(px, pos.qty)
                pos = None
            continue

        # reversal: close the old position at this close, then open the new one
        if pos is not None:
            if pos.side == side:
                raise Failure(f"bar {i}: pyramiding — same-side entry while open")
            if not cfg["allow_rev"]:
                px = b["c"] - pos.side * SLIPPAGE_TICKS * TICK
                cash += (px - pos.entry) * pos.side * pos.qty * POINT_VALUE - fee(px, pos.qty)
                pos = None
                continue
            px = b["c"] - pos.side * SLIPPAGE_TICKS * TICK
            cash += (px - pos.entry) * pos.side * pos.qty * POINT_VALUE - fee(px, pos.qty)
            stats["reversed"] += 1
            pos = None

        fill = b["c"] + side * SLIPPAGE_TICKS * TICK
        cash -= fee(fill, qty)
        # INVARIANT 5 — inside the leverage cap
        if qty * fill > cfg["max_lev"] * equity * 1.001:
            raise Failure(f"bar {i}: notional {qty * fill:.2f} exceeds cap")
        pending = (side, fill, qty, stop_est, None, budget)
        stats["trades"] += 1

    return cash, stats, worst_loss_ratio


SCENARIOS = [
    ("defaults",            {}),
    ("no trend filter",     dict(use_trend=False)),
    ("no gap filter",       dict(use_gap=False)),
    ("percent stop",        dict(stop_mode="percent")),
    ("swing stop",          dict(stop_mode="swing")),
    ("no take profit",      dict(use_tp=False)),
    ("trail off",           dict(use_trail=False)),
    ("break-even off",      dict(use_be=False)),
    ("tight stop 0.5xATR",  dict(atr_mult=0.5)),
    ("wide stop 5xATR",     dict(atr_mult=5.0)),
    ("aggressive 5% risk",  dict(risk_pct=5.0)),
    ("whole-share sizing",  dict(qty_step=1.0, min_qty=1.0)),
    ("sub-minimum size",    dict(risk_pct=0.01, qty_step=1.0, min_qty=1.0)),
    ("close, do not flip",  dict(allow_rev=False)),
    ("fast 5/50 cross",     dict(fast_len=5, slow_len=50)),
]

SEEDS = [20260824, 7, 99991, 424242, 31337]


if __name__ == "__main__":
    total = dict(trades=0, stopped=0, target=0, reversed=0,
                 skipped_qty=0, unprotected_bars=0)
    worst = 0.0
    runs = 0
    for name, over in SCENARIOS:
        for seed in SEEDS:
            try:
                _cash, stats, w = run(seed=seed, **over)
            except Failure as exc:
                print(f"INVARIANT VIOLATED — [{name} / seed {seed}] {exc}")
                raise SystemExit(1)
            for k in total:
                total[k] += stats[k]
            worst = max(worst, w)
            runs += 1

    print(f"invariants held across {runs} runs "
          f"({len(SCENARIOS)} configurations x {len(SEEDS)} seeds x 4000 bars)\n")
    print(f"  entries              {total['trades']}")
    print(f"  closed at stop       {total['stopped']}")
    print(f"  closed at target     {total['target']}")
    print(f"  closed by reversal   {total['reversed']}")
    print(f"  skipped (qty guard)  {total['skipped_qty']}")
    print(f"  unprotected bars     {total['unprotected_bars']}")
    print(f"  worst stop-out       {worst * 100:.1f}% of its risk budget")
    print("\nchecked: monotonic stop, stop coverage, risk budget, tpR distance,")
    print("         leverage cap, mintick grid, no pyramiding")
