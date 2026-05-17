---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Incremental Static Regeneration (ISR)

ISR solves the core tension in SSG: static pages are fast and cheap to serve, but they go stale. Without ISR, your only options are full rebuilds (slow, expensive) or client-side fetching (defeats the purpose). ISR gives you a third path—serve the cached page immediately, then regenerate it asynchronously once it's past its TTL.

### The mechanism

When a request hits an ISR page:

1. **First request (cold):** page doesn't exist yet—server renders it, caches it, serves it. Slow, like SSR.
2. **Subsequent requests within TTL:** serve the cached HTML instantly. Zero compute.
3. **First request after TTL expires:** serve the *stale* cached page immediately (the visitor never waits), then trigger a background regeneration. Next visitor gets the fresh page.

This is stale-while-revalidate semantics applied to the rendering pipeline, not just HTTP headers. The key insight: "stale" doesn't mean "broken"—it means slightly outdated, which is almost always acceptable.

### Concrete mental model

Think of a news homepage. You statically generate it at deploy time. With `revalidate: 60`, a visitor at 12:00:00 gets the cached build. A visitor at 12:01:05 (after TTL) still gets the old page, but kicks off a background render. The visitor at 12:01:06 gets the fresh one.

The first post-TTL request is the "trigger" visitor—they eat no latency, but they're the reason the next person gets fresh content.

### Where it breaks down

**On-demand invalidation vs. TTL:** TTL-based ISR is eventually consistent by definition. If you publish a critical correction, it won't propagate until the next revalidation cycle. Next.js added `res.revalidate()` (and later `revalidatePath`/`revalidateTag`) for on-demand ISR to patch this—useful when your CMS can call a webhook on publish.

**Cold starts on rarely-visited pages:** If a page hasn't been requested in a while, it may be evicted from the cache and treated as a cold render again. TTL doesn't mean "cached forever."

**Distributed caches:** In multi-region deployments, each region maintains its own cache. A revalidation in `us-east-1` doesn't propagate to `eu-west-1`. You can end up serving different versions across regions for the duration of the TTL.

### When to reach for it

- **Product catalog / marketing pages:** content changes infrequently, high traffic, SEO matters. ISR is the obvious fit.
- **User-generated content at scale:** per-user pages with ISR + on-demand invalidation beats SSR for cost under sustained load.
- **Dashboards with tolerable staleness:** if a 30-second-old report is fine, ISR beats SSR significantly on infrastructure cost.

Avoid it when data must be real-time (stock prices, live scores) or when the page is personalized per-user—SSR or client-side fetching are better there.
