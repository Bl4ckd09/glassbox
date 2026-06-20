import type { MarketSnapshot, TradingCall } from "./types";
import { decide, ENGINE_VERSION } from "./strategy";
import { narrate } from "./narrate";
import { getCloseSeries, getSnapshot } from "./deepbook";
import { storeJson } from "./walrus";
import { signCall } from "./sign";

// Build a fully-formed, explainable trading call from live DeepBook data and
// anchor it immutably to Walrus. The returned call carries its Walrus proof.
export async function generateCall(
  strategistId: string,
  pool: string,
  opts: { anchor?: boolean; seq?: number } = {}
): Promise<TradingCall> {
  const [snapshot, closes] = await Promise.all([getSnapshot(pool), getCloseSeries(pool, 200)]);
  return buildCallFromData(strategistId, snapshot, closes, opts);
}

export async function buildCallFromData(
  strategistId: string,
  snapshot: MarketSnapshot,
  closes: number[],
  opts: { anchor?: boolean; seq?: number } = {}
): Promise<TradingCall> {
  // need a usable series; if trades were sparse, anchor indicators on 24h OHLC
  const series = closes.length >= 10 ? closes : reconstructSeries(snapshot);
  const decision = decide(series, snapshot);
  const rationale = await narrate(decision, snapshot);

  const seq = opts.seq ?? Date.now();
  const call: TradingCall = {
    id: `${strategistId}-${seq}`,
    strategistId,
    pool: snapshot.pool,
    side: decision.side,
    confidence: Number(decision.confidence.toFixed(3)),
    indicators: decision.indicators,
    rationale,
    riskGuards: decision.riskGuards,
    entryPrice: snapshot.lastPrice,
    snapshot,
    createdAt: Date.now(),
    engineVersion: ENGINE_VERSION,
  };

  // Sign the canonical payload — proves authorship before anchoring.
  call.signature = await signCall(strategistId, {
    strategistId,
    pool: call.pool,
    side: call.side,
    entryPrice: call.entryPrice,
    confidence: call.confidence,
    createdAt: call.createdAt,
  });

  if (opts.anchor !== false) {
    // The immutable record: the entire call, written to Walrus the instant it is made.
    const proof = await storeJson({ kind: "glassbox.call", version: 1, call }, 5);
    call.walrus = proof;
  }
  return call;
}

// Deterministic fallback series anchored on real 24h OHLC when live trades are sparse.
function reconstructSeries(s: MarketSnapshot): number[] {
  const n = 30;
  const out: number[] = [];
  const lo = s.low24h || s.lastPrice * 0.98;
  const hi = s.high24h || s.lastPrice * 1.02;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // smooth path low -> high -> last, deterministic
    const wave = Math.sin(t * Math.PI);
    const base = lo + (hi - lo) * t;
    out.push(base * (1 - 0.3 * (1 - wave)) + s.lastPrice * 0.3 * t);
  }
  out.push(s.lastPrice);
  return out;
}

export { ENGINE_VERSION };
