---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Metrics Collection

Metrics are numeric measurements sampled over time — and collecting them systematically is what turns a black-box system into something you can reason about quantitatively. Unlike traces (which tell you *what happened* in a specific request), metrics tell you *how the system is behaving in aggregate*, right now and historically.

### The Core Mechanism

At the lowest level, metrics are just counters, gauges, and histograms that your code increments or records. The collection layer's job is to get those numbers out of your processes and into a queryable store with consistent timestamps and labels.

There are two fundamental collection models:

**Push**: your service actively sends metrics to a collector (e.g., StatsD, InfluxDB line protocol). Good for short-lived jobs and situations where the collector can't reach the service.

**Pull (scrape)**: a central system periodically fetches metrics from your service's `/metrics` endpoint (Prometheus's model). Better for dynamic environments because the collector controls the schedule, and you can easily detect when a target disappears.

Most systems store metrics as time-series data — a sequence of `(timestamp, value)` pairs keyed by a metric name plus a set of labels (e.g., `http_requests_total{method="POST", status="500"}`). The labels are what make metrics composable: you can aggregate across services, split by region, or drill into a single pod.

### Mental Model

Think of it like application-level telemetry in a car. Speed, RPM, oil pressure — all numeric, all sampled on a fixed interval, all labeled with context (which sensor, which trip). You don't replay every rotation of the engine to understand fuel efficiency; you look at the aggregated trend.

### Practical Scenarios

**Backend**: You instrument a payment service to emit a `payment_processing_duration_seconds` histogram. When p99 latency spikes, you can immediately query by `payment_provider` label to isolate whether it's your Stripe calls or your internal DB.

**SRE**: You define error rate as `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])`. That expression only works because metrics have been collected with consistent labels and stored at consistent intervals. This is the raw material for SLOs — without reliable metrics collection, SLI math falls apart.

**DevOps**: During a rollout, you compare the same metrics across `version="1.2.3"` and `version="1.2.4"` in real time. Canary analysis is just metrics collection + comparison with a label filter. If memory consumption diverges, you catch it before the rollout completes.

### Why It's Not Trivial

The hard parts are cardinality (too many unique label combinations explodes storage), scrape reliability (a missed scrape during an incident is the worst time to lose data), and choosing the right resolution vs. retention tradeoff. Getting these wrong means your metrics are either too expensive to keep or too coarse to be useful when you actually need them.
