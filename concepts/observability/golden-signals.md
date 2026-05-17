---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Four Golden Signals

The Four Golden Signals are Google SRE's framework for distilling service health into four metrics that, together, answer the question "is this service working?" without drowning in dashboards. They matter because most observability noise reduces to one of four root causes—you're slow, overloaded, failing, or about to fall over.

### The Four Signals

**Latency** — how long requests take, split by success vs. error. The split matters: a 500 returning in 2ms looks fast in aggregate but masks a broken system. Track percentiles (p50, p95, p99), not averages—averages lie when tail latency is your actual user experience.

**Traffic** — demand on your system, measured in the unit that makes sense for your service. HTTP requests/sec for a web API, messages/sec for a queue consumer, queries/sec for a database. This is your normalization baseline: errors at 10 req/s vs. 10k req/s are very different situations.

**Errors** — rate of failed requests. Explicit failures (5xx, thrown exceptions) are obvious. Implicit failures are trickier: a 200 that returns corrupt data, a response that times out at the client but completes server-side. Define what "error" means for your service and measure both.

**Saturation** — how full your most constrained resource is. CPU, memory, connection pool, disk I/O—whichever hits 100% first determines your ceiling. The key insight is to measure the *leading indicator* of saturation, not just current utilization. A database at 70% CPU with linear query growth will saturate in 20 minutes; that's actionable, but only if you're tracking the trend.

### Concrete Mental Model

Think of a toll booth: latency is how long each car waits, traffic is cars per minute, errors are cars that get turned away or crash the barrier, saturation is how close the lanes are to gridlock. You can immediately diagnose: long waits with low traffic → inefficiency. High errors with normal traffic → broken logic. Normal everything but saturation climbing → capacity event incoming.

### Where This Differentiates Senior Engineers

In design reviews, the question "how will we know this is working?" often gets vague answers. Anchoring on the four signals forces specificity: what's the latency SLO, how do we instrument error classification, which saturation metric do we alert on? This vocabulary also shortcuts incident investigation—when an alert fires, you immediately ask which of the four signals is affected, which narrows the blast radius of your hypotheses.

In interviews for SRE or platform roles, knowing the signals isn't enough. What differentiates you is articulating *why* they were chosen: they're orthogonal, they cover the failure modes of queuing theory (utilization, throughput, latency, errors), and they compose with SLOs naturally—your error budget is just your error signal measured against a threshold over time.

The common pitfall is treating them as a checklist rather than a framework. If saturation is fine but latency is degrading, you're not done checking saturation—you haven't found the *right* saturation metric yet.
