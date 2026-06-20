"use client";
import { useState } from "react";
import type { CallResult, TradingCall } from "@/lib/types";
import { outcomeColor, pct, price, shortId, sideColor, timeAgo } from "@/lib/format";

function VoteBar({ vote }: { vote: number }) {
  const w = Math.min(50, Math.abs(vote) * 50);
  const pos = vote >= 0;
  return (
    <div className="relative h-2 w-24 rounded-full bg-zinc-800">
      <div className="absolute left-1/2 top-0 h-2 w-px bg-zinc-600" />
      <div
        className={`absolute top-0 h-2 rounded-full ${pos ? "bg-emerald-500" : "bg-rose-500"}`}
        style={{ width: `${w}%`, left: pos ? "50%" : `${50 - w}%` }}
      />
    </div>
  );
}

export default function CallCard({
  call,
  result,
  defaultOpen = false,
}: {
  call: TradingCall;
  result?: CallResult | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [verify, setVerify] = useState<null | {
    loading: boolean;
    ok?: boolean;
    data?: unknown;
    err?: string;
    signatureValid?: boolean | null;
    signerAddress?: string | null;
  }>(null);

  async function runVerify() {
    if (!call.walrus?.blobId) return;
    setVerify({ loading: true });
    try {
      const r = await fetch(`/api/verify?blobId=${call.walrus.blobId}`);
      const j = await r.json();
      setVerify({
        loading: false,
        ok: j.verified,
        data: j.data,
        err: j.error,
        signatureValid: j.signatureValid,
        signerAddress: j.signerAddress,
      });
    } catch (e) {
      setVerify({ loading: false, ok: false, err: String(e) });
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${sideColor(call.side)}`}>{call.side}</span>
          <div>
            <div className="font-semibold text-zinc-100">{call.pool.replace("_", "/")}</div>
            <div className="text-xs text-zinc-500">
              entry {price(call.entryPrice)} · {timeAgo(call.createdAt)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500">confidence</div>
          <div className="font-mono text-sm text-zinc-200">{(call.confidence * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {result && result.outcome !== "OPEN" && (
          <span className={`rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-semibold ${outcomeColor(result.outcome)}`}>
            {result.outcome} {pct(result.realizedPct)}
          </span>
        )}
        {(!result || result.outcome === "OPEN") && (
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-amber-300">OPEN</span>
        )}
        {call.signature && (
          <span className="inline-flex items-center gap-1 rounded-md border border-violet-700/50 bg-violet-900/20 px-2 py-0.5 text-xs text-violet-300">
            ✍ signed
          </span>
        )}
        {call.walrus?.blobId ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-700/50 bg-emerald-900/20 px-2 py-0.5 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> anchored on Walrus
          </span>
        ) : (
          <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            not anchored
          </span>
        )}
        <button onClick={() => setOpen((o) => !o)} className="ml-auto text-xs text-sky-400 hover:text-sky-300">
          {open ? "hide proof & logic ▲" : "inspect proof & logic ▼"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-zinc-800 pt-4">
          {/* indicator panel */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Disclosed decision logic
            </div>
            <div className="space-y-2">
              {call.indicators.map((ind) => (
                <div key={ind.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="w-40 shrink-0 text-zinc-400">{ind.label}</span>
                  <span className="w-16 shrink-0 font-mono text-zinc-200">{ind.value}</span>
                  <span className="flex-1 truncate text-xs text-zinc-500">{ind.interpretation}</span>
                  <VoteBar vote={ind.vote} />
                </div>
              ))}
            </div>
          </div>

          {/* rationale */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Rationale</div>
            <p className="text-sm leading-relaxed text-zinc-300">{call.rationale}</p>
          </div>

          {/* risk guards */}
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Risk guards</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-zinc-800/60 p-2">
                <div className="text-[10px] uppercase text-zinc-500">size</div>
                <div className="font-mono text-sm text-zinc-200">
                  {(call.riskGuards.positionSizePct * 100).toFixed(2)}%
                </div>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-2">
                <div className="text-[10px] uppercase text-zinc-500">stop</div>
                <div className="font-mono text-sm text-rose-300">{call.riskGuards.stopLossPct}%</div>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-2">
                <div className="text-[10px] uppercase text-zinc-500">target</div>
                <div className="font-mono text-sm text-emerald-300">{call.riskGuards.takeProfitPct}%</div>
              </div>
            </div>
            <ul className="mt-2 space-y-1">
              {call.riskGuards.notes.map((n, i) => (
                <li key={i} className="text-xs text-zinc-500">
                  • {n}
                </li>
              ))}
            </ul>
          </div>

          {/* Walrus proof */}
          {call.walrus?.blobId && (
            <div className="rounded-lg border border-zinc-800 bg-black/30 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Immutable proof (Walrus {call.walrus.network})
                </span>
                <button
                  onClick={runVerify}
                  className="rounded-md bg-sky-600 px-2 py-1 text-xs font-semibold text-white hover:bg-sky-500"
                >
                  {verify?.loading ? "verifying…" : "Verify independently"}
                </button>
              </div>
              <div className="mb-1 text-[11px] text-zinc-500">
                pre-registered before outcome
                {call.walrus.storedEpoch != null && <> · Walrus epoch {call.walrus.storedEpoch}</>}
                {call.walrus.suiObjectId && <> · Sui obj {shortId(call.walrus.suiObjectId, 6, 4)}</>}
              </div>
              <div className="font-mono text-xs text-zinc-400">blobId: {shortId(call.walrus.blobId, 10, 8)}</div>
              <a
                href={call.walrus.aggregatorUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-xs text-sky-400 hover:text-sky-300"
              >
                {call.walrus.aggregatorUrl}
              </a>
              {verify && !verify.loading && (
                <div className="mt-2">
                  {verify.ok ? (
                    <div className="text-xs text-emerald-300">
                      ✓ Fetched from public Walrus aggregator — content matches. Anyone can do this without GlassBox.
                    </div>
                  ) : (
                    <div className="text-xs text-rose-300">✗ {verify.err || "verification failed"}</div>
                  )}
                  {verify.ok && verify.signatureValid === true && (
                    <div className="mt-0.5 text-xs text-emerald-300">
                      ✓ Signature valid — authored by {shortId(verify.signerAddress || "", 6, 4)}.
                    </div>
                  )}
                  {verify.ok && verify.signatureValid === false && (
                    <div className="mt-0.5 text-xs text-rose-300">✗ Signature check failed.</div>
                  )}
                  {verify.ok && (
                    <pre className="mt-1 max-h-40 overflow-auto rounded bg-black/50 p-2 text-[10px] text-zinc-400">
                      {JSON.stringify(verify.data, null, 1)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
