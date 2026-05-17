---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Metrics are numeric time-series snapshots of system state—cheaper to collect and query than traces, and the primary signal for alerting. Where distributed tracing tells you *what happened* in a specific request, metrics tell you *how the system is behaving* across millions of requests simultaneously.

## Core Mechanism

Three primitive types, each with a different aggregation contract:

- **Counter**: monotonically increasing (requests served, errors thrown). You query the *rate*, not the raw value. Resets on restart—systems must handle this.
- **Gauge**: point-in-time value that can go up or down (memory used, queue depth, active connections). No aggregation needed; just the current reading.
- **Histogram**: records the *distribution* of a value by bucketing observations (request latency: <10ms, <50ms, <100ms, etc.). This is where cardinality bites you—you can derive percentiles (p99, p999) from histograms, but you can't from averages.

The averaging trap is the most expensive mistake here. Averaging latency across instances loses the tail. A service with 95% of requests at 5ms and 5% at 2000ms reports an "average" of ~175ms—meaningless. Histograms preserve the shape.

## Cardinality: The Hidden Cost

Every unique combination of label values (tags) creates a separate time series in your TSDB (Prometheus, VictoriaMetrics, etc.). `http_requests_total{method="GET", status="200", path="/api/users"}` is one series. Add `user_id` as a label and you've created millions of series—one per user. This is **cardinality explosion**, and it tanks storage and query performance.

The rule: labels should have low, bounded cardinality. Status codes: fine (handful of values). User IDs: never. Endpoint paths: fine if you template them (`/api/users/{id}` not `/api/users/123`).

## Practical Scenarios

**Backend**: Instrument at the handler level—counters for request count by method/status, histograms for latency. Emit business metrics too: orders placed, payments processed. These become your SLIs. An SLO like "99th percentile latency < 200ms over 30 days" is only possible if you have the histogram data.

**SRE**: Metrics are the first signal for alerting. A histogram over a rolling window lets you fire an alert when p99 crosses threshold—but only if your bucket boundaries were set correctly when the service was instrumented. Changing buckets retroactively loses historical comparability.

**DevOps**: During deployments, gauge-based metrics (active pod count, memory per instance) and rate-of-change on error counters give you the canary signal. A sudden spike in `5xx_rate` within 2 minutes of rollout is catch-before-full-rollout territory that traces alone can't surface fast enough.

The discipline is instrumentation-at-write-time: you can't go back and add a histogram bucket to data you already collected. Design your metric schema before you need it in an incident.
