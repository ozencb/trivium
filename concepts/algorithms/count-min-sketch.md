---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Count-Min Sketch solves a specific problem: you need frequency counts on a high-cardinality stream (millions of unique keys, billions of events), but you can't afford a hash map that grows with the number of distinct keys. It trades exact accuracy for bounded, predictable error and fixed memory.

**The mechanism**

The structure is a 2D array of counters: `d` rows, `w` columns. Each row has its own independent hash function. To count an item, you hash it with each of the `d` functions, get `d` column indices, and increment all `d` cells. To query frequency, you hash the item the same way and return the *minimum* of the `d` cells.

The minimum is the key insight. Every counter can only be *overestimated* (other items hash to the same cell and increment it), never underestimated. So the minimum across rows gives you the tightest upper bound. You know the true count is somewhere between `0` and `result`, with the error bounded by `ε * N` (where `N` is total events) with probability `1 - δ`. You control `ε` and `δ` by choosing `w = ceil(e/ε)` and `d = ceil(ln(1/δ))`.

This is exactly why it's different from a Bloom filter: Bloom answers "have I seen this?", Count-Min answers "how often have I seen this?" — both with bounded error, neither with unbounded memory.

**Mental model**

Imagine a physical tally sheet with 5 rows and 1000 columns. You mark items in 5 different columns simultaneously (one per row, determined by hashing). When you query, you look at all 5 marks and trust the smallest number. Collisions inflate counts, but all 5 hash functions would need to collide simultaneously for you to get a badly wrong answer — and that's what the math bounds.

**Practical scenarios**

*Backend:* You're building a rate limiter or DDoS mitigation layer. You need to know which IPs or user IDs are sending the most requests in a 1-minute window. A hash map works until you have 50M unique IPs. Count-Min gives you heavy hitters (top-k) with a fixed 10MB structure regardless of cardinality. Redis implements this directly via `CMS.INCRBY` / `CMS.QUERY`.

*Data:* You're processing a Kafka stream of product views and want to surface trending items in near-real-time. Exact counts require grouping and state you can't afford at 500k events/sec. Count-Min lets you maintain a fixed-size sketch per time window and merge sketches across partitions (they're additive) — a property Bloom filters don't have.

**When not to reach for it**

When your key cardinality is actually manageable (< ~1M distinct keys in memory), a regular hash map with an LRU eviction is simpler and exact. Count-Min earns its complexity at scale where memory is the binding constraint.
