import type { StrategyDecision } from "./strategy";
import type { MarketSnapshot } from "./types";

// Optional AI narration layer. The DECISION is made by the transparent quant
// engine (auditable). Claude, if configured, only rewrites the disclosed
// reasoning into clearer natural language — it cannot change the call. This is
// deliberate: the "AI" never becomes an unaccountable black box.

export async function narrate(decision: StrategyDecision, snapshot: MarketSnapshot): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return decision.rationale; // deterministic fallback — always works

  try {
    const sys =
      "You are GlassBox's explainer. You are given a trading decision that was ALREADY made by a transparent rule-based engine, plus the exact indicator readings. Rewrite the rationale in 2-3 plain, honest sentences a retail user can trust. Never change the side, confidence, or numbers. Never hype. If HOLD, make staying flat sound responsible, not boring.";
    const user = JSON.stringify({
      pool: snapshot.pool,
      side: decision.side,
      confidence: decision.confidence,
      score: decision.score,
      indicators: decision.indicators,
      riskGuards: decision.riskGuards,
      lastPrice: snapshot.lastPrice,
      change24h: snapshot.priceChangePct24h,
    });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 320,
        system: sys,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return decision.rationale;
    const json = (await res.json()) as { content?: { text?: string }[] };
    const text = json.content?.map((c) => c.text || "").join("").trim();
    return text && text.length > 20 ? text : decision.rationale;
  } catch {
    return decision.rationale;
  }
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
