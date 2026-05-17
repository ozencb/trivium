---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Connection Hedging

When a small fraction of backend requests stall—due to GC pauses, TCP retransmits, or noisy neighbors—those stragglers dominate your p99. Connection hedging sidesteps the stall by firing a duplicate request to a second backend after a short delay, then using whichever response arrives first and cancelling the other.

### The core mechanism

The key insight is the hedge delay. You don't fire both requests simultaneously (that's scatter-gather). Instead, you fire the first request normally, start a timer set around your p90–p95 latency threshold, and only fire the second request if the timer expires before you get a response. This means the vast majority of requests—the ones that complete normally—incur zero additional fanout. Only the slow tail triggers the hedge.

A typical setup: p50 latency is 5ms, p95 is 12ms. You set the hedge delay at 15ms. Roughly 5% of requests get a second copy sent; the first responder wins; you cancel the loser. Your p99 now looks much closer to your p95 because the stalled backend is bypassed rather than waited on.

### Practical application

**Backend services**: Hedging works well against stateless, idempotent read paths—database read replicas, caches, microservice GET endpoints. The constraint is idempotency: hedging a write without an idempotency key means the losing backend may still execute the write before cancellation propagates, giving you duplicates. If you control the backend and have idempotency keys, hedging writes is feasible but adds complexity.

**SRE / reliability**: Hedging is a useful tool when tail latency spikes correlate with individual instance health issues rather than systemic overload—things like JVM GC pauses, uneven disk I/O, or hardware variance in cloud instances. It's a softer lever than circuit breaking: instead of cutting off a slow node, you route around it opportunistically.

### When to reach for it

Reach for hedging when your latency distribution has a fat tail despite a healthy median—a gap between p50 and p99 that's disproportionately large. It's most effective when the cause is intermittent per-instance problems, not sustained load.

### What will bite you

- **Forgetting to cancel**: If you don't properly cancel the losing request, backends do unnecessary work and you amplify load without recovering it.
- **Too-short hedge delay**: Set it below p50 and you've essentially built scatter-gather—nearly every request fans out, and you've doubled your load in steady state.
- **Hedging into already-overloaded backends**: If your p99 is high because the whole tier is saturated, hedging makes it worse by adding more requests to an already-stressed system. Check utilization before adding fanout.
- **Capacity planning blindspot**: Even at a 5% hedge rate, you're running at 1.05x baseline load. Factor this in when sizing replicas.

Hedging pairs naturally with load balancing: once you have multiple backends to route to, you've already done the hard work—hedging just makes the routing decision time-sensitive rather than upfront.
