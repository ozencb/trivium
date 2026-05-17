---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Observability-Driven Development

ODD treats instrumentation as a design constraint, not a post-ship cleanup task. The implicit contract: a feature isn't done until the signals needed to debug it exist in production, before on-call inherits responsibility for it.

### Core mechanism

The key insight is that observability requirements *are* design requirements. When you spec a new feature, you're also speccing: what structured log fields get emitted on each code path, what metrics define "healthy" (latency p99, error rate, queue depth), and what trace attributes let you correlate this operation across services. These aren't afterthoughts—they're acceptance criteria.

This creates a forcing function. If you can't articulate what observable success looks like before shipping, you probably don't understand the feature's behavior well enough. Defining the signals surfaces assumptions.

### Mental model

Think of it like TDD, but for runtime behavior instead of unit behavior. TDD forces you to define expected outputs before implementation. ODD forces you to define expected *signals* before deployment. The question isn't "did we add logging?"—it's "given a 3am alert, what would on-call need to reconstruct what happened, and is that information guaranteed to be in the system?"

### In practice

**Backend**: When building a new async job, you define upfront: a `job.processed` counter with `status` and `queue` labels, a duration histogram, and structured log lines with `job_id`, `user_id`, and `failure_reason` on every exit path. Staging validation includes reviewing an actual trace, not just checking that no errors appeared.

**SRE**: ODD is the policy you enforce in launch readiness reviews. Instead of asking "is there a runbook?", you ask "show me the dashboard you'd use to debug a latency spike." If the engineer can't point to it, the service isn't ready. This shifts the review from compliance theater to actual capability verification.

**Fullstack**: Client errors are often invisible without explicit instrumentation. ODD applied to frontend means new user flows ship with error boundary tracking, timing marks for critical interactions, and correlation IDs that tie browser errors to backend traces—not console.log statements that disappear in prod.

### Where senior engineers differentiate

In design discussions, the move is asking "how will we know this is working?" before anyone talks about implementation. It surfaces missing context propagation, identifies gaps in ownership early, and reveals hidden complexity (you can't instrument what you can't define). In interviews, describing ODD as a *practice*—not just a tool preference—signals you treat operability as a first-class design constraint.

**The pitfall**: treating ODD as a checklist ("we added a metric, done"). The value is the thinking it enforces, not the artifacts it produces.
