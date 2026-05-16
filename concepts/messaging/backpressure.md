---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Backpressure

When a consumer can't keep up with a producer, backpressure is the mechanism by which the consumer signals that fact upstream — so the system can slow down, buffer, or shed load rather than silently fall over.

### The core mechanism

The fundamental problem: production and consumption rates are independent. A message broker, stream processor, or API can receive data far faster than it can process it. Without backpressure, you get one of two bad outcomes: unbounded buffer growth (eventually OOM) or silent message drops.

Backpressure makes the mismatch *explicit and actionable*. The consumer exposes its capacity — either by pulling work when ready (pull-based, like Kafka's consumer poll loop) or by sending explicit signals upstream to pause/slow (push-based, like TCP's receive window or gRPC flow control). The producer then has a choice: block, buffer to a limit, drop with a policy, or reject at the edge.

The key insight is that backpressure converts a capacity problem into a *control flow problem*. You're not just hoping buffers hold — you're actively propagating the constraint back to where load originates.

### Mental model

Think of a garden hose connected to a fire hydrant. Without a valve, the hose bursts. Backpressure is the valve: downstream pressure signals upstream to regulate flow. The valve doesn't make more water fit through the hose — it just ensures the hose doesn't get destroyed by demand it can't handle.

### Practical scenarios

**Backend:** An API gateway receives 10k RPS but your downstream service handles 2k. Without backpressure, you queue requests until memory explodes or start timing out silently. With it, you reject at the gateway with `429 Too Many Requests` and surface the constraint to the caller — who can retry with backoff rather than hammering harder.

**SRE:** You're on-call and a processing service's consumer lag on Kafka is climbing. That lag *is* backpressure materializing as a queue. The question becomes: is this a temporary spike (buffer it), a sustained overload (scale consumers), or a bad actor (apply rate limiting upstream)? Understanding backpressure helps you diagnose which — and why adding more producers without scaling consumers just makes the lag worse.

**Data:** A Flink or Spark Streaming job reads from Kafka faster than it can write to a slow sink (say, a database under load). Backpressure in Flink propagates from the sink operator backward through the pipeline, throttling the source read rate. Without this, intermediate state buffers grow unboundedly. With it, the pipeline self-regulates — at the cost of reduced throughput, which is the correct tradeoff.

Backpressure doesn't solve capacity limits — it makes them visible and controllable, which is the prerequisite for handling them well.
