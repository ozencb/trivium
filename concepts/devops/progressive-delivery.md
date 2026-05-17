---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Progressive Delivery

Progressive Delivery is the operationalization of canary releases and feature flags — not just as manual deployment controls, but as automated systems that make rollout decisions based on observed metrics. The key insight is that shipping code and exposing features are decoupled, and promotion through that exposure is driven by data, not courage.

**The core mechanism**

You already know canaries (route 1% of traffic to new code) and feature flags (toggle behavior without deploying). Progressive Delivery connects these with an analysis layer. At each stage — say 1% → 10% → 50% → 100% — the system continuously evaluates baseline vs. canary metrics: error rate, p99 latency, business metrics like conversion. If the canary degrades beyond a threshold (e.g., error rate increases >0.1%), rollback is automatic. If metrics are healthy after a soak window, promotion proceeds. Humans define the policy; the system executes it.

Tools like Argo Rollouts, Flagger, and LaunchDarkly's experimentation layer implement this. The analysis can query Prometheus, Datadog, or custom metric stores.

**Mental model**

Think of it as a staged A/B test where "B loses" triggers an automatic abort. You're not just measuring adoption — you're continuously running a hypothesis test: "is the new version safe?" with statistical confidence intervals, not gut feel.

**Concrete example**

You're rolling out a new checkout service. You configure: promote at 10-minute intervals, max 25% traffic per step, rollback if HTTP 5xx rate exceeds 0.5% or p99 > 800ms. At 5%, latency spikes. Flagger detects it within one analysis window, routes all traffic back to stable, and fires a Slack alert — before most users noticed anything. You fix a connection pool bug, cut a new version, the rollout restarts.

**Where this matters in practice**

- **DevOps/Platform engineers**: You're building the scaffolding — defining analysis templates, configuring metric providers, designing rollout policies that teams inherit. The tricky part is choosing the right metrics and thresholds; too tight and you never ship, too loose and bad deploys slip through.
- **SRE**: Progressive Delivery is a reliability primitive. It dramatically reduces the "blast radius" of bad deploys. You're less likely to get paged at 3am if 95% of traffic never saw the buggy version.
- **Backend engineers**: You stop thinking in terms of "the deploy" as a moment of risk and start designing features to be incrementally exposable. That means flag-gating new code paths, ensuring backward compat during partial rollout, and writing metrics that actually reflect correctness.

**Where it differentiates you**

In design discussions, most engineers treat deployment as a binary event. Knowing Progressive Delivery means you can ask: "what does rollback look like at 40% exposure?" and "which metrics constitute a healthy rollout?" — questions that separate engineers who ship safely at scale from those who just ship.
