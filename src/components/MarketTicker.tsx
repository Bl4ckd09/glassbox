"use client";
import { useEffect, useState } from "react";
import type { MarketSnapshot } from "@/lib/types";
import { pct, price } from "@/lib/format";

export default function MarketTicker() {
  const [markets, setMarkets] = useState<MarketSnapshot[]>([]);
  const [updated, setUpdated] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/market");
        const j = await r.json();
        if (alive && j.markets) {
          setMarkets(j.markets);
          setUpdated(Date.now());
        }
      } catch {}
    }
    load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Live DeepBook markets (Sui mainnet)
        </span>
        {updated > 0 && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" title="live" />}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {markets.length === 0 &&
          [0, 1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-800/50" />)}
        {markets.map((m) => (
          <div key={m.pool} className="rounded-lg bg-zinc-800/40 p-2">
            <div className="text-xs text-zinc-400">{m.pool.replace("_", "/")}</div>
            <div className="font-mono text-sm text-zinc-100">{price(m.lastPrice)}</div>
            <div className={`text-xs ${m.priceChangePct24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {pct(m.priceChangePct24h)} · {m.spreadBps.toFixed(0)}bps
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
