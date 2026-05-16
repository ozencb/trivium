---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Cache Invalidation

A cache is only useful if its data reflects reality. Cache invalidation is the process of removing or updating stale cached data when the underlying source of truth changes — and it's hard precisely because "when" is often non-obvious.

**The core problem**

When you cache a value, you're making a bet: "this won't change before someone reads it again." That bet has a cost when you're wrong. The challenge isn't the mechanics of deletion — it's knowing *which* cached entries are affected by a given mutation, and doing that determination correctly and efficiently at scale.

Cache entries go stale in three main ways:
- **TTL expiry**: you set a time-to-live and accept eventual staleness
- **Event-driven invalidation**: something upstream explicitly invalidates on write
- **Invalidation on read**: you check freshness at read time (ETags, version tokens, etc.)

TTL is simple but blunt — you're trading correctness for simplicity, accepting a window of staleness. Event-driven is correct but requires coupling: the writer must know which caches to invalidate. Read-time validation is precise but adds latency on every cache hit.

**Concrete model**

Imagine a product page with price cached at the CDN edge. A pricing service updates the price. Without invalidation, users see the old price until TTL expires — maybe 5 minutes, maybe an hour. Event-driven invalidation means the pricing service fires a purge request on every price update. The tradeoff: complexity in the writer, but correctness in the cache.

Now add complexity: the product page also appears in a search results cache, a recommendations cache, and a personalized homepage cache. Invalidating "all pages showing product 42" requires knowing which cache keys encode that product. This is the core difficulty — cache key design and invalidation are deeply coupled.

**By role**

*Backend*: When you update a user record, which cache keys need to go? If you cached `user:123` and also `team:456:members`, both are stale. Write-through patterns and explicit key namespacing help here. Tags-based invalidation (grouping keys under a logical tag and purging the tag) is a common pattern.

*SRE*: Runaway invalidation storms are a real operational hazard. If a single write triggers invalidation of thousands of downstream keys simultaneously, you can cause a cache stampede — every reader races to recompute from the database. This is why thundering herd protection and probabilistic early expiry exist.

*Fullstack*: Next.js's `revalidateTag` / `revalidatePath` are exactly this problem surfaced at the framework level. When you call `revalidateTag('products')`, you're doing event-driven invalidation — telling the cache "anything tagged with 'products' is stale." The framework manages the key-to-tag mapping so you don't have to track individual keys.

**The philosophical point**

Phil Karlton's "two hard things" quote (naming things and cache invalidation) isn't a joke about difficulty — it's a statement about correctness under distributed mutation. Any time you have a copy of data that can change, you've introduced the invalidation problem. How you solve it determines whether your system is fast *and* correct, or just fast.
