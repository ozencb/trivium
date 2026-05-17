---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Rollback Strategies

Rollback is the ability to undo a deployment and return to the last known-good state. You need it because no deployment pipeline eliminates all production failures, and the cost of every minute in a degraded state is higher than the cost of building the escape hatch.

### The Core Mechanism

The naive mental model is: "just redeploy the old image." That works for stateless services, and if you're already running blue-green, you literally just shift traffic back to the blue environment — near-zero-cost rollback. The old fleet never went away.

The hard part is **state**. Rollback gets expensive when the deployment changed something that can't be undone by swapping binaries:

- **Database schema migrations** — if v2 added a `NOT NULL` column, rolling back to v1 means the app is now reading a schema it doesn't understand. The migration already ran; you can't un-run it by deploying old code.
- **Message queue consumers** — if v2 changed the shape of events it produces, and those events are now in the queue, v1 consumers may not be able to parse them.
- **External state mutations** — payments charged, emails sent, webhooks fired.

This is why experienced engineers often say "forward fix" rather than rollback: patch forward to v2.1 rather than revert to v1. It's frequently safer because you're not fighting the schema.

### Concrete Mental Model

Think of rollback as a spectrum:

1. **Traffic rollback** — flip the load balancer. Works instantly if infrastructure supports it (blue-green, canary weight to 0%). No state involved.
2. **Deployment rollback** — redeploy previous artifact. Works for stateless services. Fast, but blocked by incompatible schema.
3. **Data rollback** — reverse migrations, restore from snapshot. Dangerous, slow, and usually means accepting data loss. Last resort.

Most production rollbacks should be #1 or #2. If you're discussing #3, you're in incident recovery, not deployment strategy.

### Practical Scenarios

**SRE:** When you're on-call and a deploy just tanked error rates, your runbook shouldn't require thought. Blue-green means rollback is a one-line config change. Without that, you're digging through deployment tooling under pressure. The rollback path should be rehearsed, not improvised.

**DevOps:** The real discipline is making migrations rollback-compatible *before* you need to roll back. The expand-contract pattern (add new column nullable → backfill → make non-null across two separate deploys) is specifically designed so that either version of the app can run against either version of the schema. This is the prerequisite for safe blue-green with stateful services.

### Why It Matters in Interviews

Senior engineers are expected to immediately ask "what's the rollback story?" when reviewing a deployment design. Saying "we can just redeploy v1" without considering schema state is a red flag. The differentiated answer acknowledges the stateful constraints, names the tradeoffs between rollback and forward-fix, and proposes a migration strategy that keeps the option open.
