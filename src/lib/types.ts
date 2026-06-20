// GlassBox core domain types.
// A "Call" is an immutable trading recommendation. The moment it is created it is
// written to Walrus, so its existence + content can never be edited or deleted.
// That immutability is what makes a track record provably honest.

export type Side = "BUY" | "SELL" | "HOLD";

export interface MarketSnapshot {
  pool: string; // e.g. "SUI_USDC"
  baseSymbol: string;
  quoteSymbol: string;
  lastPrice: number;
  highestBid: number;
  lowestAsk: number;
  priceChangePct24h: number;
  high24h: number;
  low24h: number;
  baseVolume24h: number;
  quoteVolume24h: number;
  spreadBps: number; // (ask-bid)/mid * 10000
  takenAt: number; // ms epoch
  source: string; // "deepbook-indexer.mainnet"
}

export interface IndicatorReading {
  key: string; // "rsi14"
  label: string; // "RSI (14)"
  value: number;
  // human-readable interpretation, e.g. "oversold (<30)"
  interpretation: string;
  // numeric vote toward the decision in [-1, 1]; negative = bearish, positive = bullish
  vote: number;
}

export interface RiskGuards {
  // position sizing as a fraction of portfolio, scaled by volatility (Kelly-capped)
  positionSizePct: number;
  // hard stop loss as a percent move against the position
  stopLossPct: number;
  // take-profit target
  takeProfitPct: number;
  // max acceptable spread to trade; if live spread exceeds this we abstain
  maxSpreadBps: number;
  // notes on why these guards were chosen
  notes: string[];
}

export interface TradingCall {
  id: string; // deterministic id (strategistId + seq)
  strategistId: string;
  pool: string;
  side: Side;
  confidence: number; // 0..1
  // the deterministic, fully-auditable rule trace that produced this call
  indicators: IndicatorReading[];
  rationale: string; // human-readable explanation
  riskGuards: RiskGuards;
  entryPrice: number;
  snapshot: MarketSnapshot;
  createdAt: number;
  engineVersion: string;
  // populated after the call is written to Walrus
  walrus?: WalrusProof;
}

export interface WalrusProof {
  blobId: string;
  suiObjectId?: string;
  storedEpoch?: number;
  network: "testnet" | "mainnet";
  aggregatorUrl: string; // direct, independently-verifiable URL
  certified: boolean;
}

export type Outcome = "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";

// Recorded when a call resolves (target hit, stop hit, or horizon elapsed).
// Also written to Walrus, referencing the original call's blob — so the FULL
// lifecycle (entry + exit) is immutable and chained.
export interface CallResult {
  callId: string;
  callBlobId: string; // chains back to the immutable entry
  outcome: Outcome;
  exitPrice: number;
  realizedPct: number; // PnL on the position incl. guards
  horizonHours: number;
  resolvedAt: number;
  reason: string; // "take-profit hit" | "stop hit" | "horizon elapsed"
  walrus?: WalrusProof;
}

export type StrategistKind = "ai-agent" | "human";

export interface Strategist {
  id: string;
  name: string;
  kind: StrategistKind;
  bio: string;
  strategy: string; // short description of the visible strategy
}

// A strategist's verifiable track record, computed purely from immutable calls.
export interface TrackRecord {
  strategist: Strategist;
  totalCalls: number;
  wins: number;
  losses: number;
  open: number;
  winRate: number;
  avgReturnPct: number;
  cumulativeReturnPct: number;
  maxDrawdownPct: number;
  sharpe: number;
  avgPositionSizePct: number; // avg risk taken per call (sizing discipline)
  // Disclosed, auditable quality score (0-100). Rewards risk-adjusted, disciplined
  // systems over raw PnL — see computeGlassBoxScore. This is what the board ranks by.
  glassBoxScore: number;
  scoreBreakdown: { riskAdjusted: number; consistency: number; drawdownControl: number; discipline: number };
  // proof integrity: every call carries a Walrus blob id; none can be deleted
  allCallsAnchored: boolean;
  lastCallAt: number;
}
