---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Incremental Static Regeneration

ISR lets you serve statically generated pages while keeping them fresh — without rebuilding the entire site. It's the answer to "SSG is fast, but my data changes too often for a full rebuild to be viable."

### The core mechanism

ISR implements stale-while-revalidate at the page level. When a request comes in:

1. The cached static page is served immediately (fast, CDN-friendly)
2. If the page's TTL has expired, a background regeneration is triggered
3. The *next* request after regeneration completes gets the fresh version

The critical point: the request that triggers revalidation doesn't wait. It still gets the stale page. This means ISR trades consistency for latency — you're always fast, but you're accepting that some users see data that's up to `revalidate` seconds old.

There's also **on-demand revalidation**: instead of TTL-based expiry, you hit a revalidation endpoint (typically from a CMS webhook) to invalidate specific pages immediately when content changes. This collapses the staleness window to near-zero while keeping the static delivery model.

For dynamic routes that weren't pre-rendered at build time, ISR can generate them on first request and cache the result. Subsequent requests hit the cache. `fallback: 'blocking'` vs `fallback: true` controls whether that first request waits for generation or gets a skeleton.

### Mental model

Think of ISR as moving cache invalidation up the stack. You already know how this works at the API or DB layer — a Redis key expires or gets invalidated by a write event, and the next read triggers a cache fill. ISR applies the same pattern to fully-rendered HTML artifacts. The "cache" is your CDN/edge; the "fill" is Next.js server-side rendering and storing the result.

### Practical scenarios

**Frontend**: You're building a marketing site where the content team publishes via a headless CMS. Full rebuilds take 8 minutes and content authors hate waiting. Wire a publish webhook to the revalidation endpoint — only the affected pages regenerate, in seconds.

**E-commerce product pages**: Prices update hourly, inventory more frequently, but your catalog has 500k SKUs. Pre-rendering all of them at build time is impractical. ISR with `fallback: 'blocking'` generates pages on first access and caches them; a short TTL (60s) keeps pricing acceptably fresh without SSR cost per request.

**Fullstack dashboard**: Aggregate stats that update every few minutes don't need per-request SSR. ISR at 120s TTL gives you static delivery performance (edge-cached, no server hit) with data that's fresh enough for the use case.

### The tradeoff to internalize

ISR isn't universally better than SSR — it's a bet that eventual consistency is acceptable for your data. If a user must always see their own latest write reflected immediately, ISR without on-demand revalidation will cause confusion. The answer there is either SSR for those pages, or hybrid: ISR for public/shared content, client-side fetch for personalized data on top.
