---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CDN Edge Caching

Edge caching lets CDN nodes answer requests directly from memory instead of forwarding them to your origin — the result is lower latency, less origin load, and resilience under traffic spikes. It's the difference between your origin handling 10k req/s and handling 200 req/s because the other 9,800 were served from cache in Singapore, Frankfurt, and São Paulo.

### How it actually works

When a request hits an edge node and the cached response is missing or stale, the edge makes one request to your origin (or the next cache tier), stores the response, and serves it to subsequent requests. The edge respects `Cache-Control: max-age` for TTL and `Vary` for key differentiation. Most CDNs also support *surrogate keys* (Fastly calls them surrogate keys, Cloudflare calls them cache tags) — arbitrary labels you attach to responses that let you invalidate a whole group of cached objects at once rather than by URL.

The critical detail most engineers miss: **cache key composition**. By default, many CDNs key on the full URL including query string. If you have `?utm_source=email` variants flooding in, you're either fragmenting your cache (each variant is a separate entry) or you need to configure query string normalization. Getting the cache key wrong is the most common cause of "CDN isn't actually caching this."

### Concrete mental model

Think of it as a read-through cache that your CDN manages for you. First request per edge PoP: miss, fetch from origin, store. All subsequent requests within TTL: hit, serve from edge. Purge or TTL expiry: back to miss. The edge node is functionally a Varnish or Nginx proxy cache — just globally distributed and managed for you.

### Practical scenarios

**Backend:** Your product page API (`/api/products/123`) doesn't change per user — set `Cache-Control: public, max-age=300, stale-while-revalidate=60`. The CDN handles the thundering herd on a product launch. Attach surrogate key `product:123` so a price update can invalidate just that object across all edges instantly.

**SRE:** During an origin incident, `stale-if-error` keeps serving stale content instead of returning 502s. Combined with health checks that pull traffic to healthy origins, edge caching becomes a buffer — your users may never notice a 30-second origin degradation. Cache hit ratio on your CDN dashboard is a key SLI.

**Fullstack:** Dynamic pages that still have cacheable segments — you can cache-vary on a cookie to serve different TTLs to authenticated vs anonymous users, but ideally you structure things so anonymous pages are fully cacheable and authenticated state lives in client-side fetches, not the rendered HTML.

### When to reach for it

Anytime a response is identical across users (or a predictable subset), idempotent, and changes on a schedule you control. The moment user-specific data bleeds into a cached response, you're debugging a data leak.
