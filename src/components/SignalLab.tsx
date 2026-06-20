"use client";
import { useState } from "react";
import type { TradingCall } from "@/lib/types";
import CallCard from "./CallCard";

const POOLS = ["SUI_USDC", "DEEP_USDC", "WAL_USDC", "XBTC_USDC"];

export default function SignalLab() {
  const [pool, setPool] = useState("SUI_USDC");
  const [loading, setLoading] = useState(false);
  const [call, setCall] = useState<TradingCall | null>(null);
  const [aiNarration, setAiNarration] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setErr(null);
    setCall(null);
    try {
      const r = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool, strategistId: "aletheia" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "failed");
      setCall(j.call);
      setAiNarration(Boolean(j.aiNarration));
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Live Signal Lab</h2>
          <p className="text-xs text-zinc-500">
            Aletheia (AI agent) reads live DeepBook data → makes a call → anchors it to Walrus, instantly &amp; immutably.
          </p>
        </div>
        <span className="rounded-full border border-sky-700/50 bg-sky-900/20 px-2 py-1 text-[10px] font-semibold uppercase text-sky-300">
          {aiNarration ? "AI narration on" : "transparent engine"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {POOLS.map((p) => (
          <button
            key={p}
            onClick={() => setPool(p)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              pool === p ? "bg-sky-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {p.replace("_", "/")}
          </button>
        ))}
        <button
          onClick={generate}
          disabled={loading}
          className="ml-auto rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "reading DeepBook…" : "Generate live call ▸"}
        </button>
      </div>

      {err && <div className="mt-3 rounded-lg bg-rose-900/30 p-3 text-sm text-rose-300">{err}</div>}

      <div className="mt-4">
        {call ? (
          <CallCard call={call} defaultOpen />
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-600">
            Pick a market and generate a call. You&apos;ll get the decision, the exact logic behind it, the risk guards,
            and a one-click way to verify it on Walrus.
          </div>
        )}
      </div>
    </div>
  );
}
