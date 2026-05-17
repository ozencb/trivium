---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Distributed Rate Limiting

Single-node rate limiting is trivial — one in-memory counter per client, reset on interval. The moment you run more than one service instance, each node keeps its own counter, and clients can multiply their effective quota by fanning requests across nodes. Distributed rate limiting moves the counter into shared state so all nodes enforce a unified aggregate limit.

### Core Mechanism

The canonical implementation uses Redis's `INCR` + `EXPIRE` pattern. On each request:

1. `INCR <client-key>` — atomically increments the counter for that client/window
2. If the result is `1` (first request in window), set `EXPIRE <client-key> <window_seconds>`
3. Compare the counter to the limit; reject if over

The atomicity of `INCR` is the real insight — no read-check-write race, no lock, just one operation. `EXPIRE` arms the automatic reset without a background job.

For sliding windows, you'd reach for a sorted set: `ZADD` with request timestamps as scores, `ZREMRANGEBYSCORE` to drop entries outside the window, `ZCARD` to get the current count. More accurate, more expensive. Fixed-window has the burst-at-boundary problem (two full quotas in rapid succession straddling a reset), but it's good enough for most cases.

### Mental Model

Toll booths on every highway into a city. Without shared state, each booth has its own counter — a driver just picks a different entrance to avoid a full toll. With a shared Redis counter, all booths read and write the same number regardless of entrance. The city enforces one limit.

### Practical Scenarios

**Backend:** You're running a public API with per-tier limits (say, 1,000 req/min on the free plan) across 20 pods. Without distributed limiting, a customer hitting all 20 pods gets 20,000 effective req/min. Redis `INCR` collapses this correctly, and at ~0.5ms per operation, the enforcement overhead is negligible relative to your actual request latency.

**SRE:** During a traffic spike or targeted abuse, you want to shed load per-client without a redeploy. Updating a limit in Redis propagates instantly to all nodes. This is also where you'd implement emergency global throttles — a single key representing aggregate capacity, decremented by every node, with rejections when it hits zero.

### Pitfalls

**Redis as SPOF.** Your rate limiter is now in the critical path. Without Sentinel or Cluster, Redis going down means your enforcement layer is gone. Decide in advance: fail open (allow all traffic) or fail closed (reject all) — there's no neutral option.

**Client-side TTL calculation.** Don't calculate expiry on the application side and pass it as a TTL. Use `EXPIRE` on the Redis server so you're using server-side time. Clock skew across your nodes will cause window drift otherwise.

**Thinking consistent hashing solves it.** If you route per-client to a consistent node, local counters work — until node failure or rebalancing routes a client to a fresh counter, effectively resetting their quota mid-window. Shared state is the right answer unless you've carefully accounted for this.
