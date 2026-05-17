---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Feature toggles aren't a single pattern—they're a taxonomy, and conflating the types is what causes toggle debt, audit nightmares, and production incidents. The four types differ not just in purpose but in *who owns them*, *how long they live*, and *what happens when they're wrong*.

## The Four Types

**Release toggles** are temporary. They decouple deploy from release—you ship code dark, then flip the flag when you're ready. Lifetime: days to weeks. Owner: engineering. These should be planned for deletion from the moment they're created; if they outlive the release window, something's wrong.

**Experiment toggles** (A/B flags) are also temporary but statistically-driven. They stay alive until you have significance, then get cleaned up. Owner: product or data. The key distinction from release toggles: the *decision* to retire them is data-driven, not schedule-driven. They need consistent user bucketing (same user always sees the same variant), which adds infrastructure complexity release flags don't need.

**Ops toggles** are long-lived kill switches—circuit breakers for expensive features (background jobs, third-party integrations, heavy queries). Unlike the others, you *want* these to stick around indefinitely. Owner: ops or on-call. The risk here is forgetting they exist until a new engineer disables the "temporary-looking" flag in production.

**Permission toggles** (entitlement flags) gate features by user tier, role, or plan. These are essentially part of your authorization layer and often live forever. Owner: product/business. The mistake engineers make is treating these like release flags and baking them into the same toggle system without access control—suddenly anyone who can flip a release flag can also grant premium features to arbitrary users.

## Mental Model

Think of them by *who flips them* and *what the consequence of a wrong flip is*:
- Release: engineer, consequence is a premature release
- Experiment: automated system or data analyst, consequence is a biased experiment
- Ops: SRE at 2am, consequence is degraded but available service
- Permission: account/billing system, consequence is unauthorized access or lost revenue

## Practical Scenarios

**Backend**: An ops toggle around a slow DB query lets you disable it during peak load without a deploy. But if you store it next to your release flags, it gets swept up in a cleanup script. Separate namespaces or explicit `type` metadata prevent this.

**Fullstack**: An experiment toggle needs consistent bucketing—if the API and the frontend each independently evaluate the flag, a user can get variant A in the UI and variant B in the response. Evaluate once, propagate the result.

**DevOps**: Release flags are natural candidates for your CI/CD pipeline (auto-enable on canary success). Ops flags are not—they need human intent, not automation. Wiring the wrong flag type into automated promotion logic is a real failure mode.

The governance implication: each type needs a different review process, a different TTL policy, and ideally different storage. Mixing them into one undifferentiated flag store is where teams eventually find 300 stale flags nobody dares touch.
