# GlassBox — self-evaluation as a critical judge

_Scoring GlassBox against the published rubrics, adversarially, then noting what was changed to harden it._

## Sui bounty (weighted)

| Criterion | Weight | Honest score | Reasoning |
|---|---|---|---|
| Real-World Application | 50% | **44 / 50** | Targets a real, regulator-flagged problem (finfluencer survivorship bias / hindsight fraud). The pre-registration framing makes the use case sharp and non-generic. Held back from full marks only because adoption is two-sided (needs both providers and followers) — addressed in-product with the incentive section + a first-party AI to bootstrap. |
| Product & UX | 20% | **16 / 20** | Clean retail dashboard, live data, one-click generate, expandable verifiable history, in-browser independent verification. Loses a couple points: no wallet-connected DeepBook execution yet (read + provenance only). |
| Technical Implementation | 20% | **17 / 20** | Real DeepBook market data (order book + trade history) and real Walrus writes/reads — both load-bearing. Could go deeper with on-chain DeepBook order execution and Walrus via the TS SDK rather than HTTP publisher. |
| Presentation & Vision | 10% | **9 / 10** | "A provenance layer for every trading signal on Sui" is a clear, expandable vision. |
| **Total** | | **~86 / 100** | |

## BGA — AI Trading & Strategy track (points)

| Criterion | Pts | Honest score | Reasoning |
|---|---|---|---|
| BGA ethos (fairness/transparency) | 20 | **19** | Directly attacks info asymmetry between retail and signal sellers; the leaderboard ranks by a disclosed risk-adjusted score, explicitly *not* raw PnL — matching "reward better systems, not highest returns." |
| Innovation & technical depth | 20 | **17** | Pre-registration / commit-reveal of trading *intent* on decentralized storage is novel and defensible vs on-chain PnL trackers. Not a thin wrapper. Depth would increase with on-chain execution + zk/attestation. |
| Strategy design & risk management | 15 | **13** | Disclosed weighted-vote engine, volatility-scaled sizing, hard-capped stops, spread/liquidity abstain rule. Deliberately simple to resist overfitting; pre-registration makes every call out-of-sample by construction. |
| Transparency & verifiability | 15 | **15** | The core feature. Every call independently fetchable from a public Walrus aggregator; the score formula is disclosed and recomputable. |
| Real-world impact & use case | 10 | **8** | Consumer protection for retail traders + a trust primitive for copy-trading. Not tied to RWA/ESG, so not full marks. |
| User accessibility & UX | 10 | **9** | Plain-language rationale, retail-first dashboard. |
| Execution & demo quality | 10 | **9** | Working MVP on live data with real anchoring; 31 historical calls pre-anchored so the demo is verifiable on first load. |
| **Total** | | **~90 / 100** | |

## The differentiation question (what makes it niche, not another bot)

Adversarial prompt I held myself to: _"On-chain PnL trackers already show verified returns. Copy-trading platforms already show track records. Why does this need to exist?"_

**Answer — and the niche GlassBox owns:** existing tools prove *what a wallet did* (outcomes, reconstructed after the fact). None prove *what a strategist said they would do, in advance, and why*. GlassBox captures the **intent + reasoning + risk plan and timestamps it immutably before the outcome is known** — the exact mechanism clinical trials use (pre-registration) to eliminate publication/survivorship bias. That reframing is the moat: it's not "verifiable copy-trading," it's **"pre-registration for trading calls."**

## Changes made as a result of this evaluation

1. **Reframed the entire pitch** from generic verifiable copy-trading → **pre-registration / commit-reveal** (hero copy, README, in-app explainer).
2. **Added an incentives section** answering the two-sided-market objection (why honest providers opt in; why followers demand it; how the AI agent bootstraps).
3. **Replaced raw-PnL ranking with a disclosed, auditable GlassBox Score** that rewards risk-adjusted quality and penalises reckless sizing — implementing the BGA ethos *inside the product*.
4. **Kept the data honest:** the platform's own AI agent currently ranks last and is shown that way, which is far more credible than a conveniently-winning first-party agent.

## Known gaps / next steps (stated openly for judges)

- On-chain DeepBook order **execution** via wallet connect (currently read + provenance).
- Walrus writes via the `@mysten/walrus` TS SDK + Sui-side attestation object, instead of the public HTTP publisher.
- Cryptographic signing of each call by the provider's Sui address (so authorship, not just content, is provable).
- Longer multi-day backtests once deeper DeepBook history is indexed.
