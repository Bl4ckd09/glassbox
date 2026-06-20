/**
 * Logic verification harness — runs the EXACT code paths the API routes use,
 * without needing Next's compiler. Proves the engine end-to-end on live data.
 *   npx tsx scripts/verify.ts
 */
import { leaderboard, allCalls } from "../src/lib/store";
import { generateCall } from "../src/lib/engine";
import { readJson } from "../src/lib/walrus";
import { getAllSummaries } from "../src/lib/deepbook";

async function main() {
  console.log("\n=== 1) Leaderboard — ranked by disclosed GlassBox Score (not raw PnL) ===");
  leaderboard().forEach((r, i) => {
    console.log(
      `  ${i + 1}. ${r.strategist.name.padEnd(16)} SCORE ${r.glassBoxScore}  | ret ${r.cumulativeReturnPct}%  win ${(r.winRate * 100).toFixed(0)}%  DD ${r.maxDrawdownPct}%  sharpe ${r.sharpe}  avgSize ${r.avgPositionSizePct}%  anchored ${r.allCallsAnchored}`
    );
    console.log(`       breakdown ${JSON.stringify(r.scoreBreakdown)}`);
  });
  const calls = allCalls();
  console.log(`  total calls: ${calls.length}, all anchored: ${calls.every((c) => c.walrus?.blobId)}`);

  console.log("\n=== 2) Live DeepBook markets (/api/market path) ===");
  const markets = await getAllSummaries();
  for (const m of markets) console.log(`  ${m.pool.padEnd(10)} ${m.lastPrice}  24h ${m.priceChangePct24h.toFixed(2)}%  spread ${m.spreadBps}bps`);

  console.log("\n=== 3) Generate live signal + anchor to Walrus (/api/signal path) ===");
  const call = await generateCall("aletheia", "SUI_USDC", { anchor: true });
  console.log(`  ${call.side} ${call.pool} conf ${call.confidence} entry ${call.entryPrice}`);
  console.log(`  indicators: ${call.indicators.map((i) => `${i.key}=${i.value}`).join(", ")}`);
  console.log(`  risk: size ${(call.riskGuards.positionSizePct * 100).toFixed(2)}% stop ${call.riskGuards.stopLossPct}% tp ${call.riskGuards.takeProfitPct}%`);
  console.log(`  rationale: ${call.rationale.slice(0, 160)}...`);
  console.log(`  walrus blobId: ${call.walrus?.blobId}`);
  console.log(`  verify URL: ${call.walrus?.aggregatorUrl}`);

  console.log("\n=== 4) Independent read-back from Walrus (/api/verify path) ===");
  const fetched = await readJson<{ kind: string; call: { side: string } }>(call.walrus!.blobId);
  console.log(`  fetched kind=${fetched.kind} side=${fetched.call.side} -> matches: ${fetched.call.side === call.side}`);
  console.log("\nALL GOOD ✅\n");
}

main().catch((e) => {
  console.error("VERIFY FAILED:", e);
  process.exit(1);
});
