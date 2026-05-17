---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Cache Stampede

When a popular cache key expires, every concurrent request that was relying on it simultaneously discovers a miss and races to recompute the same value — each one independently hitting the database or origin service. Under high traffic, a single expiration event can translate to hundreds of identical expensive queries landing at once on a system that was only ever designed to handle one.

**The core problem** isn't the miss itself — it's that cache invalidation is a binary state change visible to all readers at the same instant. The moment TTL hits zero, the protection disappears for everyone simultaneously. This is fundamentally different from a cold cache warming up, where load arrives gradually. A stampede is a sharp, synchronized spike.

**Mental model:** Imagine 500 requests per second hitting a product page. Your cache holds the result for 60 seconds. When that key expires, all 500 in-flight requests see a miss in the same millisecond window and fan out to the DB. Your query that normally runs once per minute now runs 500 times in under a second.

**Common mitigations:**

*Probabilistic early expiration (PER)* — instead of expiring hard at TTL, each read has a small random chance of recomputing slightly before expiry. The probability increases as the key approaches its deadline. This naturally staggers recomputation without coordination. The formula used in practice: recompute if `current_time - (beta * log(rand())) > expiry_time`. One process refreshes the cache ahead of time while others still serve the stale value.

*Lock-based (mutex/semaphore)* — on a miss, one process acquires a lock and recomputes; others either wait or serve stale data. Serving stale is almost always the right call — a slightly outdated value beats a thundering herd. This is sometimes called "stale-while-revalidate."

**For backend engineers:** The most common real-world pitfall is cache keys tied to cron-style TTLs where thousands of entries expire at the same wall-clock second (e.g., everything cached at startup with `ttl=3600` all expires at T+1h simultaneously). Add jitter to TTLs at write time — `ttl = base_ttl + rand(0, base_ttl * 0.1)`.

**For SREs:** Cache stampedes look like sudden, correlated DB CPU spikes with no obvious upstream cause. They often follow deploys (cache flush) or scheduled jobs that touch shared data. If your on-call runbook says "increase cache TTL" to fix DB load, a stampede is the likely culprit. Monitoring the ratio of cache miss rate to DB query rate makes these events visible before they become incidents.

The fix is almost never "make the cache bigger" — it's ensuring that expiration is a gradual, distributed event rather than a synchronized one.
