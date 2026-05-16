---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Cache Stampede** (also called "thundering herd") happens when a cached value expires and multiple concurrent requests all miss simultaneously, each independently hitting the backing store to recompute the same value — hammering your database with N identical queries instead of one.

## The Mechanism

The problem is a race condition baked into naive caching: read-miss → compute → write. When a popular key expires, every request that arrives before the first writer finishes populating the cache sees a miss. With high traffic, that's potentially thousands of concurrent DB queries for the same data.

It's not just a traffic spike problem. A single heavily-trafficked key expiring at an inconvenient moment can take down a database that's otherwise handling load fine.

## Mental Model

Imagine a shared whiteboard with the answer to a hard math problem. When someone erases it, the next 500 people who need the answer all start solving it from scratch simultaneously — instead of one person solving it while the others wait.

## Core Patterns to Prevent It

**1. Probabilistic early expiration (PER)**
Rather than waiting for hard expiry, proactively recompute with increasing probability as the key approaches its TTL. Each request computes: `if random() < β * ttl_remaining then recompute`. One request wins the race before expiry; the rest keep reading the stale-but-valid value.

**2. Locking / mutex on miss**
On cache miss, acquire a distributed lock. Only the lock-holder queries the DB; other requests either wait or serve stale data. Works well but adds latency on lock contention and requires careful timeout handling.

**3. Stale-while-revalidate**
Serve the expired value immediately, trigger async background recomputation. Zero added latency for readers; the key never has a "hard" miss window. Tradeoff: callers must tolerate briefly stale data.

## Practical Scenarios

**Backend:** Your `/api/product/{id}` caches expensive DB joins with a 5-minute TTL. At peak traffic, when that key expires, you suddenly hit the DB with 2,000 concurrent queries for the same row. Fix: add a per-key mutex (Redis `SET NX PX`) — the first miss acquires the lock, recomputes, and releases; others either spin briefly or return stale data.

**SRE:** Cache stampede is a common cause of "mysterious" DB CPU spikes that happen on a regular interval — suspiciously aligned with your TTL values. If you see periodic load spikes on your database metrics with no corresponding traffic spike, check your cache TTL distribution. Randomizing TTL jitter (e.g., `base_ttl + rand(0, 30s)`) spreads expirations so no single second sees a mass expiry.

The underlying discipline: treat cache expiry as a distributed coordination problem, not just a storage concern.
