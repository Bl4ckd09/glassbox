# GlassBox — trading signals you can audit, not just trust

> Built for the **Encode Vibe Coding Hackathon** · targeting the **Sui (DeepBook & Walrus)** bounty and the **BGA AI Trading & Strategy** track.

**Live app:** _(Vercel URL — see Deployment)_
**One-liner:** **Pre-registration for trading calls.** Every call — its full reasoning and risk plan — is committed to **Walrus** *before* the outcome is known, so track records on **Sui DeepBook** become tamper-proof. No black box. No survivorship bias.

> **The sharp idea:** on-chain PnL trackers (Nansen, Arkham) show you what a wallet *did*. GlassBox proves what a strategist *said they'd do — in advance, with the receipts*. It's clinical-trial pre-registration, applied to trading.

---

## The problem (real, and regulator-flagged)

"Finfluencers" and paid signal groups have a dirty secret: **they delete their losing calls.** They post 50 trades, quietly remove the 30 that lost, screenshot the 20 that won, and sell you a 100%-win-rate fantasy. The UK's FCA and the US SEC have both issued warnings about misleading finfluencer trading promotions. Retail traders have no way to tell a real track record from a survivorship-biased highlight reel.

This is an **information-asymmetry** problem — exactly the kind BGA's "blockchain for good" ethos targets: retail users are structurally disadvantaged versus whoever controls the record.

## The solution

GlassBox is a **provenance layer for trading signals**. A signal provider — whether an AI agent or a human — publishes calls *through* GlassBox. At the moment of publication:

1. The call is computed from **live Sui DeepBook market data** (a real on-chain CLOB).
2. The **entire call** (side, entry, confidence, the exact indicator readings, the risk guards, the rationale) is serialized and **written to Walrus**, returning a content-addressed `blobId`.
3. When the call resolves, the **outcome** is *also* written to Walrus, chained to the entry blob.

Because Walrus blobs are content-addressed and certified on Sui, a provider **cannot edit or silently delete** a call after the fact. The leaderboard is therefore computed from an immutable history: **wins and losses, nothing hidden.** Anyone can re-fetch any call straight from a public Walrus aggregator and verify it — without trusting GlassBox at all.

## Why the AI is a *glass* box, not a black box

The trading decision is made by a **transparent, deterministic quant engine** (`src/lib/strategy.ts`): a disclosed weighted vote of standard indicators (SMA 7/21 trend, RSI(14) mean-reversion, momentum) with volatility-scaled position sizing and explicit, capped risk guards (stop, take-profit, max-spread abstain rule). Every number is reproducible from public data and shown in the UI.

An **optional Claude narration layer** (`src/lib/narrate.ts`, enabled by setting `ANTHROPIC_API_KEY`) only rewrites the *already-made, already-disclosed* reasoning into plainer language for retail users. The AI can clarify the decision but can never silently change it — by design, the model never becomes an unaccountable black box. This directly answers BGA's "reduce black-box opacity" criterion.

---

## How it maps to the judging criteria

### Sui bounty
| Criterion | Weight | How GlassBox scores |
|---|---|---|
| Real-World Application | 50% | Attacks a real, regulator-flagged consumer-protection problem (finfluencer survivorship bias). Useful to any signal provider or copy-trader, not a toy demo. |
| Product & UX | 20% | Clean retail dashboard: live markets, one-click signal generation, expandable verifiable history, in-browser independent verification. |
| Technical Implementation | 20% | Real DeepBook market data (order book + trade history) **and** real Walrus writes/reads — both load-bearing, not decorative. |
| Presentation & Vision | 10% | Clear narrative: a provenance layer that could underpin every signal product on Sui. |

### BGA — AI Trading & Strategy track
| Criterion | Points | How GlassBox scores |
|---|---|---|
| BGA ethos (fairness/transparency) | 20 | Directly reduces info asymmetry between retail and signal sellers. |
| Innovation & technical depth | 20 | Provenance-anchored signals on a decentralized store + on-chain CLOB — beyond a thin API wrapper. |
| Strategy design & risk management | 15 | Disclosed strategy logic, volatility-scaled sizing, hard-capped stops, spread/liquidity abstain rule. |
| Transparency & verifiability | 15 | The core feature: every call independently verifiable on Walrus. |
| Real-world impact & use case | 10 | Consumer protection for retail traders; a trust primitive for copy-trading. |
| User accessibility & UX | 10 | Plain-language rationale, retail-first dashboard, no jargon walls. |
| Execution & demo quality | 10 | Working MVP on live data with real on-chain anchoring. |

---

## Architecture

```
Live DeepBook (Sui mainnet CLOB)  ──►  Quant engine (transparent)  ──►  Call
   order book + trade history          src/lib/strategy.ts                │
                                        + optional Claude narration       │
                                                                          ▼
                                            Walrus write (immutable)  ◄────┘
                                            src/lib/walrus.ts → blobId
                                                                          │
   Leaderboard / track records  ◄── computed from immutable calls ◄───────┘
   (wins + losses, nothing hidden)
```

- **`src/lib/deepbook.ts`** — live market snapshots + real close-price series from the DeepBook indexer.
- **`src/lib/indicators.ts`** — deterministic SMA / RSI / momentum / realised-vol.
- **`src/lib/strategy.ts`** — the disclosed decision rule + risk guards.
- **`src/lib/walrus.ts`** — store/read JSON blobs via public Walrus testnet publisher/aggregator.
- **`src/lib/engine.ts`** — orchestrates: live data → decision → narration → Walrus anchor.
- **`scripts/seed.ts`** — backtests each strategist on **real DeepBook trade history** and anchors every historical call + outcome to Walrus (so the leaderboard ships with independently verifiable history).
- **API routes** — `/api/market`, `/api/signal`, `/api/leaderboard`, `/api/strategist/[id]`, `/api/verify`.

## Run locally

```bash
npm install
npm run seed     # backtests on real DeepBook data + anchors to Walrus (writes src/data/seed.json)
npm run dev      # http://localhost:3000
```

Optional: `export ANTHROPIC_API_KEY=...` to enable Claude natural-language narration.

## Verify a call yourself (no trust required)

Every call shows a Walrus `blobId` and a direct aggregator URL. Fetch it independently:

```bash
curl https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId>
```

You'll get back the exact, signed call content. Edit-proof, delete-proof.

## Deployment (Vercel)

```bash
vercel
```

The app is a standard Next.js App Router project and deploys to Vercel as-is. `src/data/seed.json` is committed so the leaderboard renders immediately.

---

_Not financial advice. Market data via the public Mysten DeepBook indexer; storage via Walrus testnet._
