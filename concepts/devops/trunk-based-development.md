---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Trunk-Based Development

Every long-lived branch is a deferred merge problem. Trunk-Based Development (TBD) eliminates that by making the trunk — usually `main` — the only branch that matters, keeping all developers integrated continuously rather than reconciling diverged histories days or weeks later.

**The core mechanism**

Developers either commit directly to trunk or use very short-lived branches (hours to 1-2 days max) that merge before context is lost. The safety net isn't branch isolation — it's feature flags and a fast, comprehensive CI suite. Code ships to production incomplete but dark; the flag controls exposure. This decouples *deployment* from *release*, which is the key insight.

Without feature flags, TBD collapses. You'd be deploying half-built features constantly. The flags are load-bearing infrastructure, not an optional add-on.

**Concrete mental model**

Think of Git Feature Branch workflows as "merge at the end." Trunk-based is "integrate constantly, release when ready." A team of 5 doing 2-week feature branches can accumulate 10 person-weeks of divergence before anyone merges. The resulting conflicts, broken assumptions, and integration surprises are hidden carrying cost that gets paid all at once under pressure.

TBD makes that cost tiny and continuous instead of large and unpredictable.

**By discipline**

*Backend:* A new API endpoint gets committed behind a flag (`enable_v2_pricing`). The handler exists in prod but returns 404 until the flag flips. QA can test it in staging by enabling it per-environment. No merge drama when the feature is ready.

*Frontend:* New redesigned checkout flow ships as dead code, gated by `new_checkout_ui`. A/B test it by gradually rolling the flag to 5% → 25% → 100%. Rollback is disabling a flag, not reverting commits.

*DevOps:* CI has to be ruthlessly fast and reliable — if the pipeline takes 40 minutes, TBD breaks down because developers queue on it. This forces investment in parallelized testing, smart test selection, and caching that pays dividends regardless.

*Fullstack:* Coordinated changes across API and UI (e.g., a new field) can land in trunk on both sides behind a shared flag, avoiding the coordination overhead of keeping two feature branches in sync across repos.

**Where it differentiates you**

Most engineers have used Gitflow by default, not by choice. In design discussions, being able to articulate *why* long-lived branches are a liability — not just that TBD is "better" — signals that you've thought about integration cost as a first-class concern. In interviews, framing TBD as "continuous integration taken seriously, not just CI tooling" shows you understand the cultural and tooling requirements, not just the branching strategy.

The failure mode to know: TBD without test discipline or feature flags isn't TBD — it's just committing broken code to main.
