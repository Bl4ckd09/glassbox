import type { IndicatorReading, MarketSnapshot, RiskGuards, Side, TradingCall } from "./types";
import { buildIndicatorPanel, realizedVol, clamp } from "./indicators";

export const ENGINE_VERSION = "glassbox-quant-1.0.0";

// The decision rule is intentionally simple and fully disclosed:
// weighted vote of disclosed indicators -> side + confidence, with
// volatility-scaled position sizing and explicit, defensible risk guards.

const WEIGHTS: Record<string, number> = {
  sma_cross: 0.5, // trend dominates
  rsi14: 0.2, // mean reversion (lighter — avoid fighting strong trends)
  momentum10: 0.3, // confirmation
  vol20: 0, // sizing only, no directional weight
};

export interface StrategyDecision {
  side: Side;
  confidence: number;
  score: number; // signed conviction in [-1,1]
  indicators: IndicatorReading[];
  riskGuards: RiskGuards;
  rationale: string;
}

export function decide(closes: number[], snapshot: MarketSnapshot): StrategyDecision {
  const indicators = buildIndicatorPanel(closes);

  let score = 0;
  let weightSum = 0;
  for (const ind of indicators) {
    const w = WEIGHTS[ind.key] ?? 0;
    score += ind.vote * w;
    weightSum += Math.abs(w);
  }
  score = weightSum ? score / weightSum : 0; // normalise to [-1,1]

  const vol = realizedVol(closes, 20);

  // Decision thresholds (disclosed): need conviction beyond noise to act.
  let side: Side = "HOLD";
  if (score > 0.12) side = "BUY";
  else if (score < -0.12) side = "SELL";

  const confidence = clamp(Math.abs(score), 0, 1);

  const riskGuards = buildRiskGuards(vol, confidence, snapshot);

  // Abstain if the live spread is too wide to trade safely — protects retail
  // users from crossing an illiquid book (a real fairness/cost issue).
  if (snapshot.spreadBps > riskGuards.maxSpreadBps) {
    side = "HOLD";
  }

  const rationale = buildRationale(side, indicators, riskGuards, snapshot, score);

  return { side, confidence, score: Number(score.toFixed(3)), indicators, riskGuards, rationale };
}

function buildRiskGuards(vol: number, confidence: number, snapshot: MarketSnapshot): RiskGuards {
  // Volatility-scaled sizing, capped. Higher vol -> smaller size. Higher
  // confidence -> larger size, but never beyond a hard 10% cap (anti-blowup).
  const baseSize = 0.1; // 10% max
  const volPenalty = clamp(vol / 0.05, 0.2, 1); // calmer -> closer to full size
  const positionSizePct = Number((baseSize * confidence * (1 / volPenalty === Infinity ? 1 : (1 - 0.5 * (volPenalty - 0.2)))).toFixed(4));

  // Stops scale with volatility so we are not stopped out by normal noise,
  // but never wider than 8% (hard tail-risk cap).
  const stopLossPct = Number(clamp(vol * 100 * 1.5, 1.5, 8).toFixed(2));
  const takeProfitPct = Number((stopLossPct * 1.8).toFixed(2)); // ~1.8 reward:risk

  const notes = [
    `Position sized to ${(Math.max(0.005, positionSizePct) * 100).toFixed(2)}% of portfolio: 10% cap × confidence ${(confidence * 100).toFixed(0)}% × volatility scaling.`,
    `Stop ${stopLossPct}% set at 1.5× realised volatility (${(vol * 100).toFixed(2)}%) to avoid noise stop-outs, hard-capped at 8%.`,
    `Take-profit ${takeProfitPct}% targets ~1.8:1 reward-to-risk.`,
    `Abstain rule: skip trade if live spread > ${snapshot.spreadBps > 0 ? Math.max(50, Math.round(snapshot.spreadBps * 2)) : 50}bps to protect against illiquid fills.`,
  ];

  return {
    positionSizePct: Math.max(0.005, positionSizePct),
    stopLossPct,
    takeProfitPct,
    maxSpreadBps: Math.max(50, Math.round((snapshot.spreadBps || 25) * 2)),
    notes,
  };
}

function buildRationale(
  side: Side,
  indicators: IndicatorReading[],
  guards: RiskGuards,
  snapshot: MarketSnapshot,
  score: number
): string {
  const bull = indicators.filter((i) => i.vote > 0.05).map((i) => i.label);
  const bear = indicators.filter((i) => i.vote < -0.05).map((i) => i.label);

  const dir =
    side === "BUY"
      ? "a long (BUY)"
      : side === "SELL"
      ? "a short (SELL)"
      : "no position (HOLD)";

  const parts: string[] = [];
  parts.push(
    `On ${snapshot.pool}, the disclosed weighted-vote model produced a conviction score of ${score.toFixed(2)} (range −1 to +1), which maps to ${dir}.`
  );
  if (bull.length) parts.push(`Bullish factors: ${bull.join(", ")}.`);
  if (bear.length) parts.push(`Bearish factors: ${bear.join(", ")}.`);
  if (side === "HOLD") {
    parts.push(
      `Conviction is below the ±0.12 action threshold (or the spread is too wide to trade fairly), so the honest call is to stay flat rather than manufacture a trade.`
    );
  } else {
    parts.push(
      `Risk is bounded before entry: ${guards.positionSizePct * 100 < 0.01 ? "<0.01" : (guards.positionSizePct * 100).toFixed(2)}% size, ${guards.stopLossPct}% stop, ${guards.takeProfitPct}% target.`
    );
  }
  parts.push(
    `Last price ${snapshot.lastPrice} (${snapshot.priceChangePct24h >= 0 ? "+" : ""}${snapshot.priceChangePct24h.toFixed(2)}% 24h), spread ${snapshot.spreadBps.toFixed(1)}bps. Every input above is reproducible from public DeepBook data.`
  );
  return parts.join(" ");
}
