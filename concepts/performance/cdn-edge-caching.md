---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CDN Edge Caching

Edge caching stores HTTP responses at CDN nodes geographically close to users, so subsequent requests for the same resource are served from the edge rather than traveling to your origin — reducing latency from hundreds of milliseconds to single digits and absorbing traffic your origin never sees.

### The Core Mechanism

The edge node acts as a **read-through cache keyed on the request**. On a cache miss, the edge fetches from origin, stores the response, and serves it to the requester. Every subsequent request matching that cache key gets the stored response until TTL expires or the entry is invalidated.

The cache key is typically the URL, but CDNs also respect the `Vary` header — which tells the cache to treat different header values (e.g., `Accept-Encoding`, `Accept-Language`) as separate cache entries. Over-varying is a common footgun: `Vary: Cookie` makes nearly everything uncacheable because most requests carry different cookies.

The headers that actually drive behavior:
- `Cache-Control: max-age=3600` — tells browsers *and* shared caches (CDN) to cache for an hour
- `Cache-Control: s-maxage=86400` — CDN-specific TTL, overrides `max-age` at the edge while browser still uses `max-age`
- `stale-while-revalidate=60` — edge serves stale content for up to 60 seconds while asynchronously refreshing it, hiding revalidation latency from users

Most CDNs also offer an **origin shield** (or mid-tier cache): a single designated node that aggregates all edge misses before hitting origin. Instead of 50 edges hammering your origin simultaneously, one does — critical for protecting against thundering herd during cache invalidation events.

### Mental Model

Think of it as a distributed L2 cache. Your origin is L1 (authoritative), the origin shield is L2 (regional), and edge nodes are L3 (per-PoP). Cache hits short-circuit at the outermost layer.

### In Practice

**Backend**: The biggest lever is `s-maxage`. API responses for non-personalized data (product catalog, public config) can carry `s-maxage=300` without touching browser behavior at all. Watch the `Vary` header — audit it; if it includes `Cookie` anywhere, that route is uncacheable at the edge.

**SRE**: Cache hit ratio is your signal. A drop from 95% to 60% means significantly more origin traffic — often from a bad deploy that changed cache keys or TTLs. During invalidation events, origin shield absorbs the collapse; without it, a full-cache purge causes a traffic spike proportional to your edge node count.

**Fullstack**: The standard pattern is long TTLs (`s-maxage=31536000`) on fingerprinted static assets (hashed filenames like `app.8f3a2b.js`) and short TTLs on HTML (`s-maxage=60` or `no-store` for personalized pages). HTML controls which asset versions users get; assets themselves can be cached forever because the filename changes on each deploy.
