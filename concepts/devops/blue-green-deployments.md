---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Blue-green deployment is a release strategy that eliminates downtime and reduces risk by running two identical production environments simultaneously, routing traffic between them atomically. The core insight is that "deploy" and "switch" are two separate operations — you can deploy safely without affecting users, then switch instantly.

## The Core Mechanism

You maintain two environments: **blue** (currently live) and **green** (staging for next release). When you're ready to ship:

1. Deploy the new version to the idle environment (green)
2. Run smoke tests, warm up caches, validate DB migrations against a copy
3. Flip the router (load balancer, DNS, or service mesh) to send 100% of traffic to green
4. Blue stays up, now idle

If something breaks, rollback is a single router flip back to blue — no re-deploy, no scramble. If everything holds, blue becomes your next staging environment.

## The Concrete Model

Think of it like a highway with two lanes and a movable barrier. Cars (requests) flow in one lane while you repave the other. When the new lane is ready, you shift the barrier. If the new asphalt is bad, shift it back. The cars never stopped.

The key is that the switch is **atomic from the user's perspective** — there's no moment where half your fleet runs v1 and half runs v2 (unlike rolling deploys).

## Practical Scenarios

**SRE:** Your primary lever for meeting SLO commitments during releases. Instead of accepting degraded availability during deploys, your error budget impact is bounded to the seconds it takes for the router to propagate. Post-switch, you define an observation window (5 min, 30 min) before decommissioning blue. If your SLI degrades, automated rollback triggers before you breach budget.

**DevOps:** Pipeline structure changes. CI doesn't just build and deploy — it builds, deploys to idle, validates, then gates the traffic switch behind a manual or automated approval. Infrastructure-as-code becomes critical because both environments must be genuinely identical; config drift between them is the most common failure mode.

**Backend:** Database migrations are the hard problem. Blue-green assumes both versions can share the same database simultaneously (during the switchover window). This forces you into backwards-compatible migrations: add columns as nullable first, backfill, then make them required in a later deploy. You can't drop a column or rename one in the same release that stops reading from it.

## What This Unlocks

Once you have atomic traffic switching, you can modulate *how much* traffic shifts — send 5% to green first, watch metrics, graduate to 100%. That's canary releases. You can also keep both environments running and use feature flags to control behavior at the application layer rather than the infrastructure layer.
