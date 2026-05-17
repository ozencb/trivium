---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Feature Flags

Feature flags are runtime conditionals that let you ship code dark — deployed but not active — and then enable it without touching the codebase or redeploying. The key insight is that "deployment" and "release" are separate events, and flags give you a control plane between them.

**The core mechanism**

A flag is just a conditional check against a configuration source — a database, an in-memory store, a dedicated service like LaunchDarkly or Unleash. At runtime, your code asks: "is feature X enabled for this request?" The answer can vary by user, org, percentage of traffic, environment, or any attribute you can attach to the context. The config changes; the code doesn't.

This differs from env-based config (which you already know) in a critical way: flags can be toggled *without* a deploy or restart, and they can target specific users rather than entire environments.

**Concrete mental model**

Think of a feature flag system as a permission layer sitting in front of your business logic:

```
if flagService.isEnabled("new-checkout-flow", user):
    return newCheckoutFlow(cart)
return legacyCheckoutFlow(cart)
```

The flag service evaluates rules: "enable for 5% of users," "enable for anyone on the beta plan," "enable only in region EU-West." You ship both code paths, then gradually migrate traffic.

**In practice**

*Backend*: You're rewriting a payment processing service. Instead of a blue-green cutover, you route 1% of real transactions through the new path, watch error rates, then ramp. If something breaks, you flip the flag — rollback in seconds, no deploy.

*Frontend*: You want to A/B test a redesigned onboarding flow. The flag system returns a variant per user. Both teams can iterate in main without coordination, and the experiment runs independently of sprint cycles.

*Fullstack*: A new API endpoint and corresponding UI ship together but behind a flag. QA tests in production against specific accounts. No staging environment drift, no merge ceremony.

*DevOps*: Flags are what make trunk-based development practical at scale. Instead of long-lived feature branches causing merge hell, everyone commits to main behind a flag. You get continuous integration without continuous release.

**The pitfalls senior engineers catch**

Flag debt is real. A flag that was "temporary" in Q1 becomes load-bearing by Q4 because both code paths are still exercised. Establish a lifecycle: flags get a removal ticket when they ship. Also, testing combinatorial explosion is subtle — with 10 boolean flags, you have 1,024 possible states. Most teams only test with flags fully on or off, which misses edge cases in gradual rollouts.

Flags also create distributed state. If your flag evaluation is inconsistent across services (different caches, different evaluation timing), a user can see the new UI but hit the old API — which should be an explicit design concern, not an afterthought.

**Why it matters in design discussions**

Feature flags are the mechanism that makes canary releases tractable. When you understand them deeply, you shift from "we deploy once a week to reduce risk" to "we deploy continuously and control exposure separately" — which is the more scalable and safe approach at any meaningful scale.
