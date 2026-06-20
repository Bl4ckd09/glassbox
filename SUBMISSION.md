# GlassBox — submission package

**Event:** Encode Vibe Coding Hackathon (Shoreditch, 19–21 June 2026)
**Bounties targeted:** Sui (DeepBook & Walrus) · BGA (AI Trading & Strategy)
**Tagline:** Pre-registration for trading calls — audit, don't trust.

## What it is (30 seconds)

Trading "finfluencers" delete their losing calls and sell you a cherry-picked highlight reel. GlassBox makes that impossible. Every call — its full reasoning and risk plan — is committed to **Walrus** (Sui's decentralized storage) *before* the outcome is known, computed from live **DeepBook** markets. Track records become tamper-proof, the AI's logic is fully disclosed, and anyone can verify any call straight from a public Walrus aggregator. It's clinical-trial pre-registration, applied to trading.

## 2-minute demo script

1. **Hero** — read the one-liner. "On-chain PnL trackers show what a wallet *did*; we prove what a strategist *said they'd do, in advance.*"
2. **Live markets** — point at the DeepBook ticker updating with real Sui mainnet prices.
3. **Signal Lab** — pick SUI/USDC, click **Generate live call**. The AI agent reads live DeepBook data and produces a call with:
   - the decision + confidence,
   - the **disclosed indicator votes** (SMA/RSI/momentum — no black box),
   - **risk guards** (size, stop, take-profit, spread-abstain),
   - a **Walrus blobId**. Click **Verify independently** → it fetches the blob from the public aggregator live. "We just proved that call exists, immutably, that anyone can check."
4. **Leaderboard** — note it's ranked by the **disclosed GlassBox Score** (risk-adjusted, *not* raw PnL — the BGA ethos). Expand **Diamond Hands Dan**: best raw return but you can see his drawdown/risk. Expand **Aletheia (our own AI)**: currently *last*, shown honestly. "We don't even rig it for ourselves."
5. **Verify a historical call** — expand any call, hit Verify. All 31 seeded calls are real Walrus blobs.

## Why it wins each rubric (one line each)

- **Sui Real-World (50%):** solves a real, regulator-flagged consumer-protection problem; sharp, non-generic niche.
- **Sui Technical (20%):** real DeepBook reads + real Walrus writes/reads, both load-bearing.
- **BGA Transparency (15):** every call + the ranking formula independently verifiable.
- **BGA Ethos (20):** ranks by risk-adjusted quality, not raw PnL; reduces retail-vs-guru asymmetry.

## Links / artifacts

- **Repo:** https://github.com/Bl4ckd09/glassbox
- **Live app:** **https://glassbox-beige.vercel.app** (deployed on Vercel, builds in cloud)
- **README.md** — full write-up + criteria mapping
- **EVALUATION.md** — adversarial self-evaluation as a judge
- **A real anchored call (verify live):**
  `https://aggregator.walrus-testnet.walrus.space/v1/blobs/<any blobId shown in the app>`

## Submission checklist

- [x] Public app built with AI tooling (the hackathon's one rule)
- [x] Uses Sui DeepBook (live market data) + Walrus (immutable call provenance)
- [x] AI trading/strategy tool with transparency & risk management (BGA)
- [x] Working MVP verified end-to-end on live data (incl. production)
- [x] README + evaluation + demo script
- [x] Deployed to Vercel — public URL live
- [x] Cryptographic authorship (each call signed by a Sui key)
- [ ] Push to public GitHub repo (needs your confirmation)
- [ ] 2–3 min demo video / live walkthrough
