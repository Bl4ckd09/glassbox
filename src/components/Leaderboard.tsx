"use client";
import { useState } from "react";
import type { CallResult, TrackRecord, TradingCall } from "@/lib/types";
import { pct, timeAgo } from "@/lib/format";
import CallCard from "./CallCard";

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`font-mono text-sm font-semibold ${tone ?? "text-zinc-200"}`}>{value}</div>
    </div>
  );
}

function Row({ rank, rec }: { rank: number; rec: TrackRecord }) {
  const [open, setOpen] = useState(false);
  const [calls, setCalls] = useState<{ call: TradingCall; result: CallResult | null }[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !calls) {
      setLoading(true);
      try {
        const r = await fetch(`/api/strategist/${rec.strategist.id}`);
        const j = await r.json();
        setCalls(j.calls);
      } finally {
        setLoading(false);
      }
    }
  }

  const ret = rec.cumulativeReturnPct;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
      <button onClick={toggle} className="flex w-full items-center gap-4 p-4 text-left">
        <div className="w-6 text-center text-lg font-bold text-zinc-600">{rank}</div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-bold text-white">
          {rec.strategist.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-zinc-100">{rec.strategist.name}</span>
            {rec.strategist.kind === "ai-agent" && (
              <span className="rounded bg-sky-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300">AI</span>
            )}
            {rec.allCallsAnchored && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-900/30 px-1.5 py-0.5 text-[10px] text-emerald-300">
                ✓ 100% on Walrus
              </span>
            )}
          </div>
          <div className="truncate text-xs text-zinc-500">{rec.strategist.strategy}</div>
        </div>
        <div className="hidden items-center gap-5 sm:flex">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wide text-sky-400">GlassBox score</div>
            <div className="font-mono text-xl font-black text-sky-300">{rec.glassBoxScore}</div>
          </div>
          <Stat label="cum. return" value={pct(ret)} tone={ret >= 0 ? "text-emerald-400" : "text-rose-400"} />
          <Stat label="win rate" value={`${(rec.winRate * 100).toFixed(0)}%`} />
          <Stat label="max DD" value={pct(rec.maxDrawdownPct)} tone="text-rose-300" />
          <Stat label="sharpe" value={`${rec.sharpe}`} />
        </div>
        <span className="ml-2 text-xs text-sky-400">{open ? "▲" : "▼"}</span>
      </button>

      {/* mobile stats */}
      <div className="flex justify-between gap-2 border-t border-zinc-800 px-4 py-2 sm:hidden">
        <Stat label="score" value={`${rec.glassBoxScore}`} tone="text-sky-300" />
        <Stat label="return" value={pct(ret)} tone={ret >= 0 ? "text-emerald-400" : "text-rose-400"} />
        <Stat label="win" value={`${(rec.winRate * 100).toFixed(0)}%`} />
        <Stat label="DD" value={pct(rec.maxDrawdownPct)} tone="text-rose-300" />
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">{rec.strategist.bio}</p>
          {/* disclosed score breakdown */}
          <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                GlassBox Score {rec.glassBoxScore} — disclosed &amp; auditable
              </span>
              <span className="text-[10px] text-zinc-600">rewards better systems, not raw PnL</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: "risk-adjusted", v: rec.scoreBreakdown.riskAdjusted, w: "35%" },
                { k: "consistency", v: rec.scoreBreakdown.consistency, w: "25%" },
                { k: "drawdown ctrl", v: rec.scoreBreakdown.drawdownControl, w: "20%" },
                { k: "risk discipline", v: rec.scoreBreakdown.discipline, w: "20%" },
              ].map((c) => (
                <div key={c.k} className="rounded bg-zinc-800/50 p-2 text-center">
                  <div className="text-[10px] uppercase text-zinc-500">
                    {c.k} <span className="text-zinc-600">{c.w}</span>
                  </div>
                  <div className="font-mono text-sm text-zinc-200">{c.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-500">
              <div>avg size <span className="font-mono text-zinc-300">{rec.avgPositionSizePct}%</span></div>
              <div>cum. return <span className={`font-mono ${ret >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{pct(ret)}</span></div>
              <div>sharpe <span className="font-mono text-zinc-300">{rec.sharpe}</span></div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Every call (wins &amp; losses — nothing hidden)
            </span>
            <span className="text-xs text-zinc-600">last: {timeAgo(rec.lastCallAt)}</span>
          </div>
          {loading && <div className="text-sm text-zinc-500">loading verifiable history…</div>}
          <div className="space-y-3">
            {calls?.map(({ call, result }) => (
              <CallCard key={call.id} call={call} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Leaderboard({ initial }: { initial: TrackRecord[] }) {
  return (
    <div className="space-y-3">
      {initial.map((rec, i) => (
        <Row key={rec.strategist.id} rank={i + 1} rec={rec} />
      ))}
    </div>
  );
}
