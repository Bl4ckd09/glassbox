import Leaderboard from "@/components/Leaderboard";
import SignalLab from "@/components/SignalLab";
import MarketTicker from "@/components/MarketTicker";
import { leaderboard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  const board = leaderboard();
  const anchored = board.length > 0 && board.every((r) => r.allCallsAnchored);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-emerald-400 font-black text-zinc-900">
            G
          </div>
          <span className="text-xl font-black tracking-tight text-zinc-100">GlassBox</span>
          <span className="ml-2 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
            Sui · DeepBook · Walrus
          </span>
        </div>
        <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-zinc-50 sm:text-4xl">
          Pre-registration for trading calls. <span className="text-emerald-400">Audit</span>, don&apos;t trust.
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Finfluencers and signal sellers quietly delete their losing calls and sell you a cherry-picked highlight
          reel. GlassBox kills that the way science killed it — <strong className="text-zinc-200">every call, its
          full reasoning, and its risk plan are committed to Walrus <em>before</em> the outcome is known</strong>.
          The intent is timestamped and immutable, so the track record can&apos;t be edited, deleted, or back-dated.
          On-chain PnL trackers show you what a wallet <em>did</em>; GlassBox proves what a strategist <em>said
          they&apos;d do</em> — in advance, with the receipts.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">🔒 Immutable on Walrus</span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">🔍 Disclosed decision logic</span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">📈 Real DeepBook markets</span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-300">🛡️ Built-in risk guards</span>
        </div>
      </header>

      <div className="mb-6">
        <MarketTicker />
      </div>

      <section className="mb-8">
        <SignalLab />
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Verifiable Leaderboard</h2>
            <p className="text-xs text-zinc-500">
              Ranked by the <strong className="text-sky-300">GlassBox Score</strong> — a disclosed, risk-adjusted
              metric, <em>not</em> raw PnL (per the BGA ethos: reward better systems, not the biggest gamble). Expand
              any provider to see the score breakdown and <em>every</em> call — wins and losses — each verifiable on
              Walrus. Even our own AI is shown warts and all.
            </p>
          </div>
          {anchored && (
            <span className="hidden rounded-full border border-emerald-700/50 bg-emerald-900/20 px-3 py-1 text-xs text-emerald-300 sm:inline">
              100% of calls anchored
            </span>
          )}
        </div>
        <Leaderboard initial={board} />
      </section>

      {/* How it works */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-lg font-bold text-zinc-100">How pre-registration works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm font-semibold text-sky-300">1 · Committed on real markets</div>
            <p className="mt-1 text-sm text-zinc-400">
              The call is computed from live Sui DeepBook order books and trade history — a real on-chain CLOB,
              not a simulation.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-sky-300">2 · Pre-registered before the outcome</div>
            <p className="mt-1 text-sm text-zinc-400">
              The full call — side, entry, reasoning, risk plan — is written to Walrus the instant it&apos;s made and
              timestamped on Sui. Content-addressed, so it can&apos;t be edited, deleted, or back-dated.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-sky-300">3 · Verifiable by anyone</div>
            <p className="mt-1 text-sm text-zinc-400">
              Click &quot;Verify independently&quot; on any call to fetch the blob straight from a public Walrus
              aggregator — no need to trust us.
            </p>
          </div>
        </div>
      </section>

      {/* Who uses it / incentives — answers the two-sided-market objection */}
      <section className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-lg font-bold text-zinc-100">Who uses it — and why they opt in</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm font-semibold text-emerald-300">Honest providers</div>
            <p className="mt-1 text-sm text-zinc-400">
              A verifiable track record is a moat. When followers can&apos;t tell real skill from a cherry-picked
              screenshot, the only way to stand out is to prove it — pre-registration is that proof.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-300">Followers</div>
            <p className="mt-1 text-sm text-zinc-400">
              Stop paying for survivorship bias. Demand a GlassBox badge before you trust a signal seller, and judge
              them on every call — including the losses.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-emerald-300">The AI agent (Aletheia)</div>
            <p className="mt-1 text-sm text-zinc-400">
              A first-party, always-honest provider that bootstraps the marketplace and shows the model works:
              disclosed logic, pre-registered calls, nothing hidden.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800 pt-6 text-center text-xs text-zinc-600">
        GlassBox · built for the Encode Vibe Coding Hackathon — Sui (DeepBook &amp; Walrus) + BGA AI Trading &amp;
        Strategy track. Not financial advice.
      </footer>
    </main>
  );
}
