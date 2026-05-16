---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Rollback strategies are the set of mechanisms you use to revert a system to a known-good state after a bad deployment — because "undo" in production is never as simple as Ctrl+Z.

## The Core Mechanism

A rollback isn't one thing. It's a spectrum of approaches, each with different speed, safety, and complexity tradeoffs. The key insight is that rollback difficulty is determined *before* you deploy, not after. The decisions you make about artifact versioning, state management, and traffic routing are what make rollback fast or catastrophic.

The main levers:

**Traffic-level rollback** — redirect traffic back to the previous version without touching the running instance. If you're using blue-green, this is just flipping the load balancer back. Fast (seconds), but only works if the old version is still running.

**Artifact rollback** — redeploy the previous container image or binary. Slower than traffic flipping (minutes), but doesn't require keeping old infrastructure warm.

**Feature-flag rollback** — disable a feature without deploying at all. The new code is in production but dormant. This is the fastest path, but requires you to have instrumented the feature with flags ahead of time.

**Configuration rollback** — revert a config change (env vars, feature flags, infra config) independently of code. Often overlooked but critical — a bad config push can cause just as much damage as bad code.

## Concrete Example

Say you deploy v2 of a payment service. Within minutes, error rates spike. You have three options depending on your setup:

1. **Blue-green**: flip the load balancer back to v1 in ~10 seconds. v2 is still running but gets no traffic.
2. **No blue-green**: redeploy v1 image, wait for pods to cycle — maybe 3-5 minutes.
3. **Feature flag on the new payment flow**: toggle it off instantly, no deploy needed.

The same failure, three very different recovery times.

## Practical Scenarios

**SRE context**: During an incident, rollback is a *mitigation*, not a fix. The SRE calculus is: "Is rolling back faster than hotfixing forward, and does it actually stop the bleeding?" If the bad code path only fires under specific conditions (a rare race condition, specific user segment), a rollback might be overkill. Feature flags let you be surgical. Also, know your rollback SLO — "we can rollback in under 5 minutes" needs to be tested regularly, not assumed.

**DevOps context**: Rollback capability is a deployment pipeline concern. You need immutable artifacts with clear versioning (so you can re-deploy an exact previous state), and your CD pipeline should make rollback a first-class operation — not something you figure out under pressure at 2am. Automated rollback triggers based on error rate thresholds (Argo Rollouts, Spinnaker) push this further.

## Why This Matters for Database Migrations

The hard constraint on rollback is state. Code is stateless and easy to swap. Databases aren't. Once you've run a migration that drops a column, there's no traffic-flip that saves you — which is exactly why forward-compatible migration patterns exist.
