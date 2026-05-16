---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Feature flags (also called feature toggles) let you deploy code that's disabled at runtime, decoupling code deployment from feature release. This means you can ship to production continuously without exposing unfinished or risky changes to users.

## Core Mechanism

A flag is just a conditional — `if (flagEnabled("new-checkout-flow"))` — but the value comes from an external source: a config file, environment variable, database row, or a dedicated service like LaunchDarkly. The key insight is that the flag's state is mutable at runtime without redeployment. You can flip a switch and the behavior changes live, for some or all users.

Flags are typically evaluated per-request and can target specific contexts: user ID, account tier, region, percentage rollout. This makes them more powerful than a simple env var — you can enable a feature for 5% of users, then 20%, then 100%, with no new deployments at each step.

## Mental Model

Think of it as a circuit breaker you control intentionally. The code for both paths exists in production simultaneously. You're not branching in git — you're branching in execution, with an externally controlled switch.

## Practical Scenarios

**Backend**: You've rewritten a pricing calculation engine. The old path is battle-tested; the new one is untested under real load. Ship both, flag-gate the new one, enable it for internal users first, compare outputs, then gradually roll out. If something breaks, flip the flag — no rollback deploy needed.

**Frontend**: A redesigned dashboard is ready but stakeholders want to see it before users do. Gate it behind a flag, give stakeholders a preview URL that sets a cookie enabling the flag, get sign-off, then enable for everyone. No separate staging environment required.

**Fullstack**: A new API endpoint and the UI that consumes it need to launch together. Gate both behind the same flag. The endpoint exists but returns 403 unless the flag is on; the UI conditionally shows the new component. One flag controls a coordinated release across the stack.

**DevOps/Platform**: You're migrating from one secrets manager to another. Flag which backend each service uses. Roll it forward service-by-service, with easy per-service rollback if the new system misbehaves. No big-bang migration.

## What to Watch For

Flags accumulate. A codebase with 40 stale flags becomes hard to reason about — every path is conditional. Flag hygiene (removing flags after full rollout) is a real maintenance cost teams underestimate.

This connects directly to canary releases: a percentage-rollout flag *is* a canary, just implemented in code rather than at the infrastructure layer. The difference is granularity — flags can target specific user segments, not just random traffic slices.
