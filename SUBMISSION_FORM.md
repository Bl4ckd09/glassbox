# GlassBox — copy-paste submission answers

Paste these straight into the Encode submission form. Two links you'll always need:
- **GitHub:** https://github.com/Bl4ckd09/glassbox
- **Live app:** https://glassbox-beige.vercel.app

---

### Project name
GlassBox

### One-line tagline
Pre-registration for trading calls — every signal + reasoning is committed to Walrus before the outcome, so track records can't be faked.

### Tracks / bounties
Sui (Build the Next AI-Native App on Sui with DeepBook & Walrus) · BGA (AI Trading & Strategy)

### Short description (≈50 words)
Trading "finfluencers" delete their losing calls and sell a cherry-picked highlight reel. GlassBox makes that impossible: every AI/human call — its full reasoning and risk plan — is signed by a Sui key and committed to Walrus the instant it's made, computed from live DeepBook markets. Tamper-proof, auditable track records.

### Full description
GlassBox is a provenance layer for trading signals. A provider — AI agent or human — publishes a call through GlassBox. At that moment the call is (1) computed from live Sui DeepBook order books and trade history, (2) cryptographically signed by the provider's Sui Ed25519 key, and (3) written immutably to Walrus, returning a content-addressed blob ID. When the call resolves, its outcome is also written to Walrus, chained to the entry.

Because Walrus blobs are content-addressed and the call is signed, a provider can't edit, delete, or back-date a call, and can't forge one in someone else's name. The leaderboard is computed from this immutable history — wins and losses, nothing hidden — and ranks by a disclosed, risk-adjusted "GlassBox Score" (not raw PnL), implementing BGA's "reward better systems, not the biggest gamble" directly in the product. The AI's decision logic is a transparent weighted-vote quant engine with disclosed indicators and explicit risk guards; an optional Claude layer only narrates the already-made decision. Anyone can re-fetch any call from a public Walrus aggregator and verify both content and signature — no need to trust GlassBox.

The deeper idea: on-chain PnL trackers show what a wallet *did*; GlassBox proves what a strategist *said they'd do, in advance, with the receipts*. It's clinical-trial pre-registration, applied to trading.

### How it uses the sponsor tech
- **Sui DeepBook:** live market data (order books + trade history) from the DeepBook indexer; signals are computed from real on-chain CLOB data, and historical track records are backtested on real DeepBook trades.
- **Walrus:** every call + outcome is stored as an immutable blob (testnet publisher/aggregator); 31 historical calls ship pre-anchored and independently verifiable.
- **Sui keys:** each strategist signs the canonical call payload (Ed25519 personal-message); `/api/verify` re-checks the signature against the signer's Sui address.

### Tech stack
Next.js 16, TypeScript, Tailwind, @mysten/sui, @mysten/deepbook-v3, @mysten/walrus, Vercel. Optional Anthropic Claude (Haiku) for narration.

### Demo (2 min)
1. Hero: "We prove what a strategist *said they'd do, in advance.*"
2. Live DeepBook ticker (real Sui mainnet prices).
3. Signal Lab → Generate live call → see decision + disclosed indicator votes + risk guards + Walrus blob → click **Verify independently** (fetches from public aggregator + checks signature live).
4. Leaderboard ranked by disclosed GlassBox Score. Expand Diamond Hands Dan (flashy but you see his risk) and Aletheia, our own AI, shown *underperforming* — we don't even rig it for ourselves.
5. Verify any historical call on Walrus.

### What's next (stated openly)
On-chain DeepBook order execution via wallet-connect; Walrus writes via the TS SDK + a Sui Move attestation object; client-side provider signing; longer multi-day backtests.

### Repo / live links
- Code: https://github.com/Bl4ckd09/glassbox
- Live: https://glassbox-beige.vercel.app
- Verify a real call: `https://aggregator.walrus-testnet.walrus.space/v1/blobs/<blobId from the app>`
- Self-evaluation vs. both rubrics: see `EVALUATION.md` in the repo.

### Team
_(add your name / handle here)_

---

## Encode platform form — long answers

### Q1. How you are incorporating the selected challenge(s)

**Sui — AI-Native App with DeepBook & Walrus.** GlassBox uses both featured technologies as load-bearing components. DeepBook: every signal is computed from live on-chain DeepBook market data (order books + trade history), and the leaderboard is backtested on real DeepBook trades. Walrus: every call — reasoning, risk plan, outcome — is written immutably to Walrus the instant it's made; 31 historical calls ship pre-anchored as real blobs anyone can fetch from a public aggregator. Sui keys: each strategist signs the canonical call payload with a Sui Ed25519 key, so authorship is provable. The AI-native part is a transparent quant agent with optional Claude narration that never overrides the decision.

**BGA — AI Trading & Strategy.** An AI trading-strategy tool built around fairness and transparency, not raw returns — matching "reward better systems, not the highest returns." It attacks information asymmetry: signal sellers delete losing calls and sell a survivorship-biased highlight reel. We rank by a disclosed, auditable risk-adjusted "GlassBox Score" instead of PnL. Strategy logic is fully disclosed (indicator votes + explicit risk guards: volatility-scaled sizing, hard-capped stops, spread/liquidity abstain). Transparency & verifiability is the core — every call and the ranking formula are independently checkable.

**Best use of Vercel.** Built and shipped on Vercel: Next.js 16 (App Router) with all backend logic as Vercel serverless Functions (/api/market, /api/signal, /api/leaderboard, /api/verify). Built AI-first with Claude Code; the production build runs in Vercel's cloud and the live demo is hosted there. The optional AI narration is structured to drop into the Vercel AI SDK.

### Q2. Detailed explanation of the submission

What it is: a provenance layer for trading signals — "pre-registration for trading calls." A provider (AI or human) publishes a call; at that moment it is computed from live Sui DeepBook data, signed by their Sui key, and committed immutably to Walrus before the outcome is known. When it resolves, the outcome is also written to Walrus, chained to the entry. Because blobs are content-addressed and calls are signed, nothing can be edited, deleted, back-dated, or forged. The leaderboard is computed from that immutable history and ranked by a disclosed risk-adjusted score. Insight: on-chain PnL trackers show what a wallet did; GlassBox proves what a strategist said they'd do, in advance — clinical-trial pre-registration applied to trading.

Process: pulled the exact rubrics for both bounties; generated and scored 3-5 ideas against both; chose the idea in the overlap so one build competes for both (Walrus = Sui technical + BGA transparency; DeepBook = Sui stack + BGA on-chain path). Sharpened framing from "verifiable copy-trading" to "pre-registration." Built iteratively: transparent quant engine, DeepBook integration, Walrus flow, a seed generator that backtests on real trades and anchors every call, then a polished dashboard. Verified end-to-end on live data, deployed to Vercel, then hardened with two adversarial-review upgrades: Sui-key signing of every call, and a disclosed GlassBox Score replacing raw-PnL ranking.

Key achievements: (1) genuinely on-chain, not mocked — real DeepBook reads + 31 real Walrus blobs; (2) cryptographic authorship — tampering/impersonation breaks verification; (3) a disclosed risk-adjusted scoring system operationalising "better systems, not biggest gamble"; (4) radical honesty — even our own AI agent is shown underperforming; (5) shipped live on Vercel with a public repo, full criteria mapping, and an adversarial self-evaluation.

Context/honesty: track records use real but short-window DeepBook tick data; remaining next steps stated openly — on-chain execution via wallet-connect, Walrus writes via the TS SDK + a Sui Move attestation object, and longer multi-day backtests.
