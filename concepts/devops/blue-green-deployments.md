---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Blue-Green Deployments

You maintain two identical production environments — call them Blue and Green. At any moment, one is live (serving traffic) and the other is idle. To deploy, you update the idle environment, run your validation, then flip a router/load balancer to point traffic at it. The previously live environment becomes the new idle one. Rollback is flipping the router back — takes seconds.

**The core mechanism**

The key insight is that the "deployment" and the "release" are decoupled. You're not modifying a running system; you're preparing a separate one and doing an atomic traffic switch. The hard part of traditional deployments — the window where you're partially upgraded, running mixed versions, or in the middle of a restart — simply doesn't exist.

The router switch can be a DNS change, an ALB target group swap, a Kubernetes service selector update, or a feature flag in your edge layer. The implementation varies, but the principle is the same: traffic goes 100% one way or 100% the other.

**Mental model**

Think of it like a stage and a wing. The show is running on stage (Blue). You rehearse the next show fully in the wing (Green) — same set, same rigging, same crew count. When ready, you rotate the stage. If something breaks mid-first-act, you rotate back. The audience barely notices.

**Where it matters in practice**

- **SRE**: Your rollback story becomes deterministic. No "we need to re-run migrations in reverse" or "let's pray the in-flight requests drain cleanly." If Green goes wrong, Blue is exactly the state production was in 10 minutes ago — warm, connected, known-good.

- **DevOps**: Deployment pipelines become dramatically simpler to reason about. Smoke tests, integration checks, and synthetic traffic can all run against Green before it ever takes real load. The go/no-go decision is clean.

- **Backend**: This exposes a real constraint quickly — your database schema must be forward- and backward-compatible if both environments share a DB. A column rename mid-deploy breaks the Blue environment if you switch Green in too early. This forces discipline around expand/contract migrations.

**When to reach for it**

Blue-green is worth the operational overhead when downtime has a real cost (SLAs, revenue, user trust) and when your deploy frequency justifies the infra investment. It's overkill for a weekend side project, but standard practice for anything with an SLA.

**The gotcha most people hit first**

Stateful sessions. If users have sessions tied to Blue instances and you flip to Green, those sessions can break unless you've externalized session state (Redis, a DB) rather than keeping it in-process. Same goes for in-flight async jobs, websocket connections, and anything else that assumes process continuity.

This is the foundation for canary releases — instead of a full flip, you send 5% of traffic to Green first. Same infrastructure, more granular control.
