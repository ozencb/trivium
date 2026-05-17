---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Admission Control

When a system is overloaded, queuing more work doesn't buy time — it compounds the problem. Admission control is the discipline of deliberately rejecting requests at the boundary when the system cannot serve them well, preserving quality of service for the requests it does accept.

### The Core Insight

The failure mode admission control prevents is **latency collapse**: a system under heavy load often degrades super-linearly. Add 30% more requests than it can handle, and you don't get 30% slower responses — you might get 300% slower, for everyone. Thread pools fill, GC pressure spikes, lock contention rises, and the whole system thrashes. The queue becomes a waiting room that serves no one.

The mechanism: measure meaningful signals of saturation — queue depth, thread pool utilization, p99 latency, CPU, active connections — and when they cross thresholds, reject new requests immediately with a `503` or `429` rather than enqueuing them. Fast failures are returned to callers in milliseconds; queued requests tie up resources for seconds.

### Mental Model

A restaurant that stops seating new guests when the kitchen is full, rather than packing the waiting room and making everyone's dinner take three hours. The guests being turned away are inconvenienced, but the seated guests still get their food hot.

### How It Differs from What You Already Know

You know rate limiting (per-consumer quotas, enforced by policy) and bulkheads (isolating failure domains between services). Admission control is different: it's **adaptive** and **systemic**. It responds to actual runtime state rather than predetermined limits, and it's about protecting the service from itself under load, not from any one consumer.

### For Backend Engineers

The practical shape of this is deciding *what* to measure and *where* to enforce. A Go HTTP server might check goroutine count against a ceiling before accepting a request. A service behind a database might reject when the connection pool is 90% utilized — before trying to acquire a connection and timing out. gRPC surfaces this natively via `RESOURCE_EXHAUSTED`. The interesting design decision is choosing a leading indicator (queue depth, thread utilization) over a lagging one (latency) — by the time latency is bad, you're already in trouble.

### For SREs

Admission control is the operational difference between graceful degradation and a full outage. A service that sheds load controllably keeps serving some percentage of traffic during an incident; one that accepts everything and queues it usually collapses entirely. This shows up in load shedding policies, autoscaling cooldown strategies, and knowing which dashboards signal "we're about to fall over" versus "we already have." Setting thresholds too conservatively wastes headroom; too aggressively and you're shedding unnecessarily. Tuning those thresholds from load test data — rather than intuition — is a senior-level responsibility.

### Why This Comes Up in Design Discussions

When designing for high availability, the question "what happens when you get 10x your expected load?" separates defensive architectures from fragile ones. Admission control is a concrete, articulable answer — and it signals you think about systems under failure, not just steady state.
