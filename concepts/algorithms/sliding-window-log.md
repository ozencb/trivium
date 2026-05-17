---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Sliding Window Log Rate Limiting

Unlike fixed windows (which restart a counter every N seconds and allow boundary bursts), the sliding window log tracks the exact timestamp of every request and asks at each arrival: "how many requests happened in the last N seconds from *right now*?" This gives you precise enforcement with no edge cases — at the cost of storing every timestamp.

### Core Mechanism

When a request arrives at time `T`:
1. Add `T` to the log for that client
2. Purge all entries older than `T - window_size`
3. If `len(log) > limit`, reject; otherwise allow

That's it. No bucketing, no approximation. The window is literally a sliding slice of wall time anchored to each incoming request.

The memory cost is O(requests in window) per client. At 100 req/min limit, you're storing up to 100 timestamps per user — trivial for most workloads, but meaningful at scale. A client hammering your limit across 10,000 users with a 1-minute window means you're holding a million entries in Redis.

### Concrete Example

Client is allowed 5 requests per 10 seconds.

```
t=0:  [0]           → 1 entry, allow
t=3:  [0, 3]        → 2 entries, allow
t=7:  [0, 3, 7]     → 3 entries, allow
t=9:  [0, 3, 7, 9]  → 4 entries, allow
t=10: purge t<0, log=[3,7,9,10] → 4 entries, allow
t=11: purge t<1, log=[3,7,9,10,11] → 5 entries, allow
t=12: purge t<2, log=[3,7,9,10,11,12] → 6 entries — REJECT
```

Fixed window would have reset at t=10 and allowed that burst. Sliding window log doesn't care about clock ticks — it only cares about what happened in the actual trailing window.

### When to Reach For This

**Backend:** Use it when you're protecting an endpoint where boundary bursts genuinely cause harm — payment processing, SMS sending, expensive third-party API calls. The exactness is worth it. Don't use it for high-throughput APIs where approximate enforcement (sliding window counter) is fine and memory matters.

**SRE/Platform:** This is the right algorithm when you're writing the rate limiter itself and need correctness as a baseline before optimizing. In Redis, implement it with a sorted set: score = timestamp, value = unique request ID. `ZRANGEBYSCORE`, `ZREMRANGEBYSCORE`, and `ZCARD` give you the full implementation in a few atomic Lua lines. The downside you'll hit in production: memory grows proportionally with allowed rate × window size × active clients. Monitor cardinality of your sorted sets.

### Common Pitfall

Clock skew across multiple servers — if your timestamps aren't from a single source or aren't monotonic, you'll get inaccurate window slices. In distributed systems, use server-side timestamps at the Redis layer, not client-supplied ones.
