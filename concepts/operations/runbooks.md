---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Runbooks

A runbook is a pre-written decision tree for a known failure mode — not documentation, but an *executable checklist* that a half-awake engineer can follow at 3am without needing to hold context in their head. The value isn't the knowledge itself; it's that the knowledge is available at the moment you need it most, when cognitive load is highest.

### Core mechanism

The insight is that most incidents aren't novel. A service goes down because of the same five reasons 90% of the time: OOM kill, upstream dependency degraded, bad deploy, resource exhaustion, config change. Runbooks encode the institutional knowledge of "what we did last time" into a format that decouples *knowing what to do* from *figuring out what to do under pressure*.

The canonical structure: **Symptom → Diagnostic steps → Remediation options → Escalation path**. Critically, each step should be executable (specific commands, not vague instructions like "check the logs"). A runbook that says "verify database connectivity" is worse than useless; one that says `psql -h $DB_HOST -U appuser -c "SELECT 1"` lets you act.

### Concrete example

Your alerting fires: `HighCartServiceLatency — p99 > 2s for 10 minutes`. The alert links directly to the Cart Service Runbook. Step 1: check downstream dependencies — one command to query your APM. Step 2: check Redis hit rate — one command. Step 3: if hit rate < 80%, run the cache warm script. Step 4: if latency persists, enable read replica fallback via feature flag. Step 5: if still degraded, page the database team.

Without the runbook, you'd spend 10 minutes just orienting yourself before acting.

### Practical patterns

**SRE:** Runbooks live in the same repo as alert definitions (or at minimum, alerts link directly to them). Stale runbooks are dangerous — treat them like tests: if a runbook wasn't consulted in the last 90 days, it probably needs review. Some teams do runbook dry-runs during game days.

**DevOps/Platform:** Runbooks for infrastructure operations (rolling restarts, scaling events, certificate rotation) are especially high-value because these are low-frequency, high-stakes procedures. The person executing them may not be the person who designed the system.

**Backend:** Service owners write runbooks; on-call rotation actually *runs* them. This asymmetry is where most teams fail — the person writing it knows too much and skips steps they consider obvious.

### Where it matters in interviews

When discussing incident response, observability, or on-call design, mentioning runbooks signals you've thought about *knowledge transfer* not just tooling. The senior move is connecting runbooks to mean time to recovery (MTTR): faster diagnosis + no tribal knowledge dependency = lower MTTR regardless of alert quality.

The failure mode to call out: runbooks that are written once and never updated. A runbook that diverges from reality is worse than none — it adds false confidence.
