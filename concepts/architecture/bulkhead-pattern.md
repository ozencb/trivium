---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Bulkhead Pattern

The bulkhead pattern partitions resources so that failure or saturation in one partition can't exhaust resources needed by others. Where Circuit Breaker stops calls to a failing dependency, bulkhead limits *how much of your system* that dependency can take down with it.

### The core mechanism

The name comes from watertight compartments in ship hulls — if one compartment floods, the others stay dry. In software, the "compartments" are resource pools: thread pools, connection pools, semaphores, or even process isolation.

Without bulkheads, your service has a single shared pool of threads (or connections). If downstream service A starts responding slowly, callers block waiting for responses. Those threads pile up until the pool is exhausted. Now requests to service B — which is perfectly healthy — also fail, because there are no threads left to handle them. One slow dependency has taken down your entire service.

With bulkheads, you carve that pool into named partitions. Calls to service A draw from A's pool; calls to service B draw from B's. A's threads can fill up and start rejecting requests — but B's threads are untouched.

The two common implementations:
- **Thread pool isolation**: each integration gets its own bounded executor. Overhead: context switching between pools, but strong isolation.
- **Semaphore isolation**: a counter limits concurrent calls without spawning threads. Lower overhead, but doesn't protect against slow blocking calls that tie up the caller thread.

### Concrete example

Say you have an API that calls a payment service, a recommendations service, and a user profile service. Payment starts timing out at 5s instead of 200ms. Without bulkheads, the 200-thread pool fills with stuck payment calls in seconds — every endpoint on your service starts throwing 503s. With bulkheads: payment gets 30 threads, recommendations gets 30, profiles get 30. Payment degrades in isolation; the rest of your service keeps serving traffic.

### For backend engineers

Implement this at the HTTP client level — most circuit breaker libraries (Resilience4j, Polly, Hystrix) bundle bulkhead support. Size each pool based on expected peak concurrency plus headroom, not your total available threads. A pool that's too large defeats the purpose; too small and you'll shed load unnecessarily.

### For SREs

Bulkheads map naturally to tenant isolation in multi-tenant systems: separate rate limits, queue depths, or worker pools per customer tier. A noisy tenant hitting their limit gets 429s; premium customers see nothing. This is also the principle behind Kubernetes resource quotas per namespace — CPU and memory bulkheads enforced at the orchestration layer rather than in code.

The key insight: Circuit Breaker is reactive (trips after failure is detected). Bulkhead is structural — it limits blast radius regardless of whether the failure is detected.
