---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Canary Releases

A canary release routes a small percentage of real traffic to a new version before committing to a full rollout, giving you production signal without full production exposure. The core value isn't the gradual ramp itself—it's that real user behavior reveals failure modes that staging never will.

### The Mechanism

Unlike blue-green, which treats deployment as a binary switch, canary splits traffic at the load balancer or service mesh level. You start routing maybe 1-5% of requests to the new version while the rest still hit the stable one. You watch metrics—error rates, latency percentiles, business KPIs—then either promote (widen the split) or rollback (drain the canary entirely). The decision can be manual, time-gated, or automated against SLO thresholds.

The name comes from coal mining: canaries were deployed into mines as early warning systems. Same idea—expose a small slice of traffic to potential danger before committing everyone.

### A Concrete Mental Model

Imagine you're deploying a new version of your payment service. In blue-green, you'd flip all traffic at once and roll back if things explode. With canary, you send 1% of checkout traffic to v2. If p99 latency or error rate spikes on that 1%, you drain it before any customer notices at scale. If metrics hold for 10 minutes, bump to 10%. If they hold for 30 minutes, go to 50%, then 100%.

The crucial insight: 1% of production traffic is often more representative than 100% of staging traffic, because real users do unexpected things.

### Practical Scenarios

**SRE:** Canary is your error budget's best friend. You define rollout gates tied directly to SLIs—if error rate on the canary exceeds 0.5%, the pipeline pauses or auto-rolls back. You're spending a controlled amount of reliability risk to validate a release rather than gambling the whole budget on a single flip.

**DevOps:** Canary naturally integrates into CD pipelines as a promotion gate. Tools like Argo Rollouts or Flagger automate the metric analysis and traffic shifting, so "deploy to canary → wait for analysis → promote" becomes a first-class pipeline stage, not a manual process.

**Backend:** The tricky part is usually database compatibility. During a canary, both versions are simultaneously live, so schema changes must be backward-compatible with the current version. This forces the strangler pattern for migrations: add the new column while the old code still writes to the old column, then ramp the canary, then clean up. It's more work, but it's the discipline that makes zero-downtime deployments real.

### Connection to Feature Flags

Canary releases operate at the infrastructure level—traffic routing. Feature flags operate at the code level—conditional behavior per user. They're complementary: canary controls *who runs the new binary*, feature flags control *what behavior that binary exposes*. You'll often use both together, which is where this leads next.
