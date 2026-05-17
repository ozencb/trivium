---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Three Pillars of Observability**

Observability is the property of a system that lets you understand its internal state from external outputs alone—no attach-a-debugger required. Logs, metrics, and traces aren't three ways to do the same thing; they're three orthogonal projections of system behavior that together make the state space fully queryable.

**Core mechanism**

The key insight is the cardinality vs. granularity tradeoff. Each pillar occupies a different point on this axis:

- **Metrics** are aggregates. Low cardinality, high compression. You lose individual events but gain the ability to reason over millions of operations at millisecond resolution. Good for "is something wrong?"
- **Logs** are discrete events. High cardinality, no aggregation. You preserve every individual occurrence with arbitrary context. Good for "what exactly happened?"
- **Traces** are causal chains. They stitch together work done across services for a single request, preserving causality and timing. Good for "where did latency come from and why?"

None can substitute for the others. A spike in p99 latency tells you *that* something is slow. A trace tells you *where* in the call graph time was spent. A log tells you *what* was different about that specific request. You need all three angles to localize and explain behavior.

**Mental model**

Debugging a slow API response: a metric alert fires (p99 > 2s). You pull a trace for an affected request and see 1.8s spent in the payment service. You look at logs from that service during that window and find it was retrying a downstream call three times due to connection pool exhaustion. The metric said *something* regressed; the trace scoped it to a service; the log explained root cause. Remove any one pillar and you're guessing.

**Practical scenarios**

- **Backend**: When adding a new service, instrument all three from day one. Metrics let you set SLOs; traces track request flow across boundaries; logs are your escape hatch when a trace alone isn't enough.
- **SRE**: Incident response naturally flows alert (metric) → scope (trace) → diagnose (log). Encoding this as a runbook makes on-call faster and more consistent.
- **Fullstack**: Traces spanning browser → API gateway → microservices require correlation IDs propagated end-to-end. This is where frontend engineers start caring about trace context headers, not just console logs.
- **DevOps**: Unified collection pipelines (what OpenTelemetry standardizes) let you emit all three from one instrumentation layer and route to different backends—Prometheus for metrics, Jaeger for traces, Loki for logs—without rewriting instrumentation per-destination.

The senior-engineer distinction: most engineers know the three pillars exist. The differentiator is understanding *why the cardinality tradeoff makes each irreplaceable*, and designing systems where all three are emitted by default—not bolted on after the first production incident.
