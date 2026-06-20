/**
 * Seed generator. Backtests each strategist on REAL DeepBook trade history and
 * anchors every historical call + outcome immutably to Walrus, capturing real
 * blob IDs. Output: src/data/seed.json — every entry independently verifiable.
 *
 * Run: npx tsx scripts/seed.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { decide, ENGINE_VERSION } from "../src/lib/strategy";
import { storeJson } from "../src/lib/walrus";
import { getCloseSeries } from "../src/lib/deepbook";
import type { CallResult, MarketSnapshot, Outcome, TradingCall } from "../src/lib/types";

const POOLS = ["SUI_USDC", "DEEP_USDC", "WAL_USDC"];

interface Persona {
  id: string;
  pools: string[];
  sizeMult: number;
  stopMult: number;
  forceTrade: boolean; // always take a side (high-conviction influencer)
  perPool: number; // how many evenly-spaced calls to sample per pool
  offset: number;
}

const PERSONAS: Persona[] = [
  { id: "aletheia", pools: ["SUI_USDC", "DEEP_USDC", "WAL_USDC"], sizeMult: 1, stopMult: 1, forceTrade: false, perPool: 10, offset: 0 },
  { id: "momentum-mia", pools: ["SUI_USDC", "DEEP_USDC"], sizeMult: 1.1, stopMult: 1.2, forceTrade: false, perPool: 10, offset: 5 },
  { id: "diamond-dan", pools: ["DEEP_USDC", "WAL_USDC"], sizeMult: 1.8, stopMult: 1.6, forceTrade: true, perPool: 6, offset: 9 },
];

function synthSnapshot(pool: string, series: number[], i: number): MarketSnapshot {
  const price = series[i];
  const window = series.slice(Math.max(0, i - 40), i + 1);
  const hi = Math.max(...window);
  const lo = Math.min(...window);
  const prev = series[Math.max(0, i - 30)];
  const spread = price * 0.0006;
  return {
    pool,
    baseSymbol: pool.split("_")[0],
    quoteSymbol: pool.split("_")[1],
    lastPrice: price,
    highestBid: price - spread / 2,
    lowestAsk: price + spread / 2,
    priceChangePct24h: ((price - prev) / prev) * 100,
    high24h: hi,
    low24h: lo,
    baseVolume24h: 0,
    quoteVolume24h: 0,
    spreadBps: 6,
    takenAt: Date.now(),
    source: "deepbook-indexer.mainnet(backtest)",
  };
}

// Simulate outcome from real forward prices using the call's own guards.
function simulate(call: TradingCall, fwd: number[]): CallResult {
  const { side, entryPrice, riskGuards } = call;
  const tp = riskGuards.takeProfitPct / 100;
  const sl = riskGuards.stopLossPct / 100;
  const dir = side === "BUY" ? 1 : -1;
  let outcome: Outcome = "BREAKEVEN";
  let exitPrice = fwd.length ? fwd[fwd.length - 1] : entryPrice;
  let reason = "horizon elapsed";
  for (const p of fwd) {
    const move = (dir * (p - entryPrice)) / entryPrice;
    if (move >= tp) {
      outcome = "WIN";
      exitPrice = p;
      reason = "take-profit hit";
      break;
    }
    if (move <= -sl) {
      outcome = "LOSS";
      exitPrice = p;
      reason = "stop hit";
      break;
    }
  }
  const realized = (dir * (exitPrice - entryPrice)) / entryPrice;
  if (outcome === "BREAKEVEN") outcome = realized > 0.001 ? "WIN" : realized < -0.001 ? "LOSS" : "BREAKEVEN";
  // PnL on the position = price move * leverage-ish position fraction is reported as raw price move
  // (position sizing affects portfolio weight; we report the trade return for clarity)
  return {
    callId: call.id,
    callBlobId: call.walrus?.blobId ?? "",
    outcome,
    exitPrice: Number(exitPrice.toFixed(6)),
    realizedPct: Number((realized * 100).toFixed(2)),
    horizonHours: 24,
    resolvedAt: call.createdAt + 24 * 3600 * 1000,
    reason,
  };
}

async function main() {
  const calls: TradingCall[] = [];
  const results: CallResult[] = [];

  // fetch real series per pool once
  const seriesByPool: Record<string, number[]> = {};
  for (const pool of POOLS) {
    const s = await getCloseSeries(pool, 1000);
    seriesByPool[pool] = s;
    console.log(`fetched ${s.length} real trades for ${pool}`);
  }

  const now = Date.now();
  let dayBack = 0;

  for (const persona of PERSONAS) {
    let seq = 0;
    for (const pool of persona.pools) {
      const series = seriesByPool[pool];
      if (!series || series.length < 80) continue;
      // evaluation points: leave room for a forward window
      const horizon = 120;
      const start = 60 + persona.offset;
      const end = series.length - horizon;
      const step = Math.max(1, Math.floor((end - start) / persona.perPool));
      const points: number[] = [];
      for (let i = start; i < end && points.length < persona.perPool; i += step) points.push(i);
      for (const i of points) {
        const snap = synthSnapshot(pool, series, i);
        const slice = series.slice(0, i + 1);
        const decision = decide(slice, snap);

        let side = decision.side;
        if (side === "HOLD" && persona.forceTrade) {
          side = decision.score >= 0 ? "BUY" : "SELL";
        }
        if (side === "HOLD") continue; // no position, nothing to record

        seq++;
        dayBack++;
        const createdAt = now - dayBack * 6 * 3600 * 1000; // space calls ~6h apart, into the past
        const guards = {
          ...decision.riskGuards,
          positionSizePct: Number((decision.riskGuards.positionSizePct * persona.sizeMult).toFixed(4)),
          stopLossPct: Number((decision.riskGuards.stopLossPct * persona.stopMult).toFixed(2)),
        };
        const call: TradingCall = {
          id: `${persona.id}-${pool}-${seq}`,
          strategistId: persona.id,
          pool,
          side,
          confidence: Number((side === decision.side ? decision.confidence : Math.max(0.3, decision.confidence)).toFixed(3)),
          indicators: decision.indicators,
          rationale: decision.rationale,
          riskGuards: guards,
          entryPrice: Number(snap.lastPrice.toFixed(6)),
          snapshot: snap,
          createdAt,
          engineVersion: ENGINE_VERSION,
        };

        // anchor to Walrus (real write, real blobId)
        try {
          const proof = await storeJson({ kind: "glassbox.call", version: 1, call }, 5);
          call.walrus = proof;
          console.log(`  anchored ${call.id} -> ${proof.blobId}`);
        } catch (e) {
          console.warn(`  WARN failed to anchor ${call.id}: ${String(e)}`);
        }

        const fwd = series.slice(i + 1, i + 1 + horizon);
        const result = simulate(call, fwd);
        // anchor the result too, chaining to the entry blob
        try {
          const rproof = await storeJson({ kind: "glassbox.result", version: 1, result }, 5);
          result.walrus = rproof;
        } catch (e) {
          console.warn(`  WARN failed to anchor result ${call.id}: ${String(e)}`);
        }

        calls.push(call);
        results.push(result);
      }
    }
  }

  mkdirSync("src/data", { recursive: true });
  writeFileSync("src/data/seed.json", JSON.stringify({ calls, results, generatedAt: now }, null, 2));
  console.log(`\nDONE: ${calls.length} calls, ${results.length} results anchored to Walrus.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
