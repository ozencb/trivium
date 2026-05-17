---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Cache Invalidation

Caching is trivially easy; keeping a cache correct is not. The moment you store a copy of data, you've created two sources of truth that must agree — and every mutation that bypasses the cache is a silent lie waiting to be read.

**The core problem**

A cache is a bet: "this data won't change before someone reads it." Invalidation is what happens when the bet loses. The difficulty isn't the mechanics of deletion — it's *knowing when to invalidate*. That requires the cache to have complete knowledge of every write path to the underlying data. In a system with multiple services, async queues, direct DB writes, and third-party integrations, achieving that knowledge is genuinely hard.

There are two fundamental strategies, and the tradeoffs between them define most of the design space:

**TTL (time-to-live):** Every cached entry expires after N seconds. Simple, self-healing, no write coordination needed. The cost is guaranteed staleness — you accept that reads may return data up to N seconds stale. Works well when stale-for-a-bit is acceptable (product catalog, feature flags, user profiles).

**Active invalidation:** When a write happens, explicitly purge or update the cached entry. Zero staleness, but now your write path must know about the cache. The bug surface explodes: what if the cache write succeeds but the DB write fails? What if two services write concurrently and invalidation messages arrive out of order?

**Mental model**

Think of a whiteboard shared across a team. Someone photographs it (the cache). The moment anyone edits the whiteboard, every photograph is stale — but the photographer doesn't know. TTL says "assume photos expire after an hour." Active invalidation says "whoever edits the whiteboard must notify every photographer." Both break under specific failure modes.

**In practice**

*Backend:* The cache-aside pattern (read from cache, miss → load from DB → populate cache) is the default. Pair it with explicit invalidation on writes. The silent killer: background jobs or admin scripts that write directly to the DB, bypassing the invalidation logic entirely.

*SRE:* TTL becomes a reliability lever. Aggressively short TTLs under incident → more DB load. Too long → stale data persists during rollbacks or config changes. Most outages involving caches aren't cache failures — they're invalidation gaps that surfaced under load.

*Fullstack:* CDN caching is invalidation at scale. A deploy that changes HTML/JS must purge or version cache keys globally across edge nodes, with propagation delays measured in seconds to minutes. Cache-busting via content-hashed filenames sidesteps invalidation entirely for static assets — the URL changes, so the old cache entry is simply abandoned.

The reason Phil Karlton's quote ("there are only two hard things in computer science: cache invalidation and naming things") has lasted: both problems are fundamentally about maintaining consistent mappings across independently-evolving systems. There's no clean solution, only tradeoffs you must choose consciously.
