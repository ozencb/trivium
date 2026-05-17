---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Backpressure

When a consumer can't process data as fast as a producer generates it, *something* has to give. Backpressure is the mechanism by which that fact propagates upstream — so the producer slows down rather than the system silently accumulating debt that eventually crashes it.

### The core mechanism

The fundamental invariant backpressure enforces: **producers can only send as fast as consumers can receive**. The implementation varies, but the shape is always the same — the consumer exposes some signal ("I'm ready," "I have N slots," "pause") and the producer is obligated to honor it.

TCP is the canonical example. The receiver advertises a *window size* — the number of bytes its buffer can hold. The sender cannot transmit beyond that window. When the receiver is slow, the window shrinks to zero and the sender blocks. No explicit coordination needed; the protocol enforces the invariant mechanically.

In higher-level systems (message queues, async streams, service calls), backpressure is often absent by default and must be deliberately designed in. A queue with unbounded capacity gives producers no resistance — they keep enqueuing, memory grows, and the crash comes later rather than immediately. That's worse: the failure is delayed, harder to attribute, and arrives at peak load.

### Mental model

Think of it as a feedback loop. Without backpressure: producer → unbounded buffer → consumer. With backpressure: producer ← signal ← consumer, where the signal is "I'm processing, hold on." The buffer exists but is bounded; hitting that bound is the signal.

### In practice

**Backend**: Reactive Streams (Project Reactor, RxJava) build backpressure into the programming model — a subscriber *requests* N elements, and the publisher emits at most N. gRPC bidirectional streaming uses flow control credits. Without this, a fast upstream service will OOM a slow downstream one under load.

**SRE**: Queue depth is a backpressure proxy metric. A monotonically growing queue means backpressure isn't working — the producer is winning. Load shedding (rejecting requests with 429/503) is a blunt backpressure mechanism: you're signaling upstream "slow down" by making the cost visible immediately rather than absorbing it invisibly.

**Data**: Spark Structured Streaming has an explicit `spark.streaming.backpressure.enabled` setting that throttles ingestion based on processing rate. Without it, a burst in Kafka can overwhelm the executor, causing GC pressure and job failures. Kafka itself doesn't do backpressure — consumers lag — which is why consumer lag monitoring is critical.

### Why ignoring it cascades

Absent backpressure, slow consumers cause buffer bloat, which causes latency spikes, which cause timeouts upstream, which cause retries, which increases load, which slows the consumer further. Each tier amplifies the problem for the one above it. The system doesn't degrade gracefully — it falls off a cliff.
