import type { IndicatorReading } from "./types";

// Deterministic technical indicators. Every number here is reproducible from the
// input price series — this is the "glass box": no hidden state, no black box model.

export function sma(values: number[], period: number): number {
  if (values.length < period) period = values.length;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

export function rsi(values: number[], period = 14): number {
  if (values.length < 2) return 50;
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) changes.push(values[i] - values[i - 1]);
  const slice = changes.slice(-period);
  let gains = 0;
  let losses = 0;
  for (const c of slice) {
    if (c > 0) gains += c;
    else losses -= c;
  }
  const avgGain = gains / slice.length;
  const avgLoss = losses / slice.length;
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Annualised-ish realised volatility from returns (std dev of pct changes).
export function realizedVol(values: number[], lookback = 20): number {
  if (values.length < 3) return 0;
  const rets: number[] = [];
  const slice = values.slice(-(lookback + 1));
  for (let i = 1; i < slice.length; i++) rets.push((slice[i] - slice[i - 1]) / slice[i - 1]);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance);
}

// Momentum = pct change over a window.
export function momentum(values: number[], window = 10): number {
  if (values.length < 2) return 0;
  const w = Math.min(window, values.length - 1);
  const past = values[values.length - 1 - w];
  const now = values[values.length - 1];
  return (now - past) / past;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

// Build the full, voting indicator panel from a close-price series.
export function buildIndicatorPanel(closes: number[]): IndicatorReading[] {
  const fast = sma(closes, 7);
  const slow = sma(closes, 21);
  const rsi14 = rsi(closes, 14);
  const mom = momentum(closes, 10);
  const vol = realizedVol(closes, 20);

  const readings: IndicatorReading[] = [];

  // 1. Trend: fast vs slow SMA crossover
  const crossPct = ((fast - slow) / slow) * 100;
  readings.push({
    key: "sma_cross",
    label: "SMA 7 vs 21 (trend)",
    value: Number(crossPct.toFixed(2)),
    interpretation:
      crossPct > 0.3
        ? "fast above slow — uptrend"
        : crossPct < -0.3
        ? "fast below slow — downtrend"
        : "flat / no clear trend",
    vote: clamp(crossPct / 2, -1, 1),
  });

  // 2. RSI mean-reversion
  readings.push({
    key: "rsi14",
    label: "RSI (14)",
    value: Number(rsi14.toFixed(1)),
    interpretation:
      rsi14 < 30 ? "oversold (<30) — bullish" : rsi14 > 70 ? "overbought (>70) — bearish" : "neutral",
    // oversold -> bullish vote, overbought -> bearish vote
    vote: clamp((50 - rsi14) / 30, -1, 1),
  });

  // 3. Momentum
  readings.push({
    key: "momentum10",
    label: "Momentum (10)",
    value: Number((mom * 100).toFixed(2)),
    interpretation: mom > 0.01 ? "positive momentum" : mom < -0.01 ? "negative momentum" : "flat",
    vote: clamp(mom * 25, -1, 1),
  });

  // 4. Volatility (not directional — used for sizing, shown for transparency)
  readings.push({
    key: "vol20",
    label: "Realised vol (20)",
    value: Number((vol * 100).toFixed(2)),
    interpretation: vol > 0.05 ? "high volatility — size down" : vol < 0.015 ? "calm" : "moderate",
    vote: 0,
  });

  return readings;
}

export { clamp };
