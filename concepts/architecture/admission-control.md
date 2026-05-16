---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Admission Control

Admission control is the practice of **proactively rejecting work before accepting it**, based on the current health or load of your system. Where rate limiting throttles based on request rates, admission control makes accept/reject decisions based on real-time system state.

### The Core Idea

The fundamental insight: a fast rejection is almost always better than a slow failure. If your system is under severe load and you accept a request anyway, that request consumes resources while degrading response times for everyone, often resulting in a timeout anyway — except now you've wasted 30 seconds and some memory on it. A 503 returned in 1ms lets the caller retry immediately, route elsewhere, or fail fast.

Admission control answers the question: *given the current state of the system, can I responsibly take on this unit of work?*

### How It Works in Practice

The decision logic is state-based, not rate-based. Common signals:

- **Concurrency limits**: if in-flight requests > N, reject. This is often the simplest and most effective form.
- **Latency signals**: if p99 response time is above threshold, start shedding. Netflix's Concurrency Limit library does this — it dynamically adjusts limits based on observed latency.
- **Queue depth**: if the work queue is saturated, stop accepting.
- **Resource utilization**: CPU, thread pool occupancy, connection pool availability.

You can implement it as middleware that checks system state before handing off to your handler — the handler never sees requests it can't serve well.

### Mental Model

Think of an ER triage system. When the ER is overwhelmed, the nurse at the door directs non-critical patients to come back tomorrow. The hospital doesn't start treatment on everyone who walks in and then abandon them halfway through because there aren't enough beds. Admission control is the triage nurse, not a queue.

### Connecting to What You Know

You already know **rate limiting** — that's input-based governance (requests/sec). Admission control is output/state-based governance (current system health). They're complementary: rate limiting handles "is this caller sending too much?", admission control handles "can my system absorb anything at all right now?"

**Bulkhead pattern** partitions your capacity into isolated pools. Admission control is the gating logic at the entrance to each pool. A bulkhead without admission control can still get overwhelmed — requests pile into the compartment until it floods anyway.

### Practical Scenarios

**Backend**: A database-backed service under a traffic spike. Before admission control, all requests hit the DB and exhaust the connection pool, causing cascading timeouts. With it, once the in-flight count exceeds your connection pool size, new requests get fast 503s and the system stays stable.

**SRE**: Admission control is a reliability lever in your playbook. Instead of a full rollback during an incident, you can dial down the admission threshold to let the system recover without complete downtime — essentially a controlled brownout. It also makes load shedding explicit and observable, which is easier to reason about than cascading timeout failures.
