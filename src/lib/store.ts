import type { CallResult, Strategist, TrackRecord, TradingCall } from "./types";
import seed from "@/data/seed.json";

// In-memory store seeded from immutable, Walrus-anchored historical data.
// Source of truth for any single call is ALWAYS Walrus (each call carries a
// blobId). This store is just an index for fast leaderboard rendering.

export const STRATEGISTS: Strategist[] = [
  {
    id: "aletheia",
    name: "Aletheia",
    kind: "ai-agent",
    bio: "GlassBox's in-house AI agent. Transparent weighted-vote quant engine; every decision is disclosed and anchored to Walrus.",
    strategy: "Trend (SMA 7/21) + RSI mean-reversion + momentum, volatility-scaled sizing.",
  },
  {
    id: "momentum-mia",
    name: "Momentum Mia",
    kind: "human",
    bio: "Independent signal provider focused on trend continuation. Publishes calls through GlassBox so followers can verify, not just trust.",
    strategy: "Discretionary momentum, GlassBox-anchored.",
  },
  {
    id: "diamond-dan",
    name: "Diamond Hands Dan",
    kind: "human",
    bio: "High-conviction caller who forces a trade on every setup. Sometimes that pays — but on GlassBox his drawdowns and risk metrics are visible too, so followers see the whole risk profile, not just the wins.",
    strategy: "Discretionary high-conviction swings, GlassBox-anchored.",
  },
];

interface SeedShape {
  calls: TradingCall[];
  results: CallResult[];
}

const seedData = seed as unknown as SeedShape;

// live (runtime) additions on top of the seed
const liveCalls: TradingCall[] = [];
const liveResults: CallResult[] = [];

export function getStrategist(id: string): Strategist | undefined {
  return STRATEGISTS.find((s) => s.id === id);
}

export function allCalls(): TradingCall[] {
  return [...seedData.calls, ...liveCalls].sort((a, b) => b.createdAt - a.createdAt);
}

export function callsFor(strategistId: string): TradingCall[] {
  return allCalls().filter((c) => c.strategistId === strategistId);
}

export function allResults(): CallResult[] {
  return [...seedData.results, ...liveResults];
}

export function addLiveCall(call: TradingCall) {
  liveCalls.unshift(call);
}

export function addLiveResult(result: CallResult) {
  liveResults.unshift(result);
}

export function getCall(id: string): TradingCall | undefined {
  return allCalls().find((c) => c.id === id);
}

function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
}

function clamp(x: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, x));
}

// Disclosed, fully-auditable quality score. Deliberately NOT raw PnL: per the
// BGA ethos, we reward better *systems*, not the highest returns. Anyone can
// recompute this from the immutable calls.
export function computeGlassBoxScore(parts: {
  sharpe: number;
  winRate: number;
  maxDrawdownPct: number; // negative
  avgPositionSizePct: number; // fraction, e.g. 0.02
  closedCalls: number;
}): { score: number; breakdown: TrackRecord["scoreBreakdown"] } {
  // 1. Risk-adjusted return (Sharpe-based), 35%
  const riskAdjusted = clamp(50 + 18 * parts.sharpe);
  // 2. Consistency (win rate), 25%
  const consistency = clamp(parts.winRate * 100);
  // 3. Drawdown control, 20% — shallower drawdowns score higher
  const drawdownControl = clamp(100 - Math.abs(parts.maxDrawdownPct) * 22);
  // 4. Risk discipline, 20% — penalise oversized positions (recklessness).
  //    A prudent baseline is ~2% of portfolio per call; size above that is penalised.
  const baseline = 0.01;
  const over = Math.max(0, parts.avgPositionSizePct - baseline) / baseline;
  const discipline = clamp(100 - over * 55);
  // small-sample shrinkage toward 50 so a 2-call fluke can't top the board
  const conf = Math.min(1, parts.closedCalls / 8);
  const raw = 0.35 * riskAdjusted + 0.25 * consistency + 0.2 * drawdownControl + 0.2 * discipline;
  const score = clamp(50 + (raw - 50) * conf);
  return {
    score: Number(score.toFixed(1)),
    breakdown: {
      riskAdjusted: Number(riskAdjusted.toFixed(0)),
      consistency: Number(consistency.toFixed(0)),
      drawdownControl: Number(drawdownControl.toFixed(0)),
      discipline: Number(discipline.toFixed(0)),
    },
  };
}

export function trackRecordFor(strategistId: string): TrackRecord {
  const strategist = getStrategist(strategistId)!;
  const calls = callsFor(strategistId);
  const results = allResults().filter((r) => calls.some((c) => c.id === r.callId));

  const closed = results.filter((r) => r.outcome !== "OPEN");
  const wins = closed.filter((r) => r.outcome === "WIN").length;
  const losses = closed.filter((r) => r.outcome === "LOSS").length;
  const open = calls.length - closed.length;
  const rets = closed.map((r) => r.realizedPct);

  // cumulative compounded return
  let cum = 1;
  for (const r of rets) cum *= 1 + r / 100;
  const cumulativeReturnPct = (cum - 1) * 100;

  // max drawdown over the equity curve
  let peak = 1;
  let equity = 1;
  let maxDd = 0;
  for (const r of rets) {
    equity *= 1 + r / 100;
    peak = Math.max(peak, equity);
    maxDd = Math.min(maxDd, (equity - peak) / peak);
  }

  const avg = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const sd = std(rets);
  const sharpe = sd ? (avg / sd) * Math.sqrt(rets.length || 1) : 0;
  const winRate = closed.length ? wins / closed.length : 0;
  const maxDrawdownPct = Number((maxDd * 100).toFixed(2));
  const avgPositionSizePct = calls.length
    ? calls.reduce((a, c) => a + (c.riskGuards?.positionSizePct ?? 0), 0) / calls.length
    : 0;

  const { score, breakdown } = computeGlassBoxScore({
    sharpe,
    winRate,
    maxDrawdownPct,
    avgPositionSizePct,
    closedCalls: closed.length,
  });

  return {
    strategist,
    totalCalls: calls.length,
    wins,
    losses,
    open,
    winRate,
    avgReturnPct: Number(avg.toFixed(2)),
    cumulativeReturnPct: Number(cumulativeReturnPct.toFixed(2)),
    maxDrawdownPct,
    sharpe: Number(sharpe.toFixed(2)),
    avgPositionSizePct: Number((avgPositionSizePct * 100).toFixed(2)),
    glassBoxScore: score,
    scoreBreakdown: breakdown,
    allCallsAnchored: calls.every((c) => Boolean(c.walrus?.blobId)),
    lastCallAt: calls[0]?.createdAt ?? 0,
  };
}

export function leaderboard(): TrackRecord[] {
  return STRATEGISTS.map((s) => trackRecordFor(s.id)).sort((a, b) => b.glassBoxScore - a.glassBoxScore);
}

export function resultFor(callId: string): CallResult | undefined {
  return allResults().find((r) => r.callId === callId);
}
