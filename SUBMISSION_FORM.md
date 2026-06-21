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
