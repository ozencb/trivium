---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CDN Cache Purging

When you deploy new code or update content, your CDN's edge nodes are still serving stale cached versions — purging is how you tell them to drop those cached objects so the next request fetches fresh ones from origin. Without it, you either wait for TTLs to expire (slow) or nuke everything (expensive).

### The Core Mechanism

CDNs cache objects keyed by URL path by default. A basic purge sends an API call to the CDN provider specifying one or more URLs or path patterns to invalidate. The edge nodes drop those entries from cache, and the next request for that URL misses cache and re-fetches from origin.

The more powerful pattern is **surrogate keys** (also called cache tags). You tag cached responses at serve time — e.g., `Cache-Tag: product-42 category-shoes` — and then purge by tag rather than URL. This lets you invalidate all content related to `product-42` across thousands of URL variations (listing pages, search results, related items) with a single API call. Fastly pioneered this; Cloudflare calls them Cache Tags, AWS CloudFront uses invalidation paths.

### Concrete Example

You have an e-commerce site. Product 42's price changes. Without surrogate keys, you'd need to know every URL that renders that product — the product page, category pages, search results, homepage featured section — and purge each one explicitly. With surrogate keys, your origin tags every response that includes product 42 data with `product-42`. Price update triggers `purge_tag("product-42")` and you're done.

### Practical Scenarios

**Backend**: Your deployment pipeline should trigger purges post-deploy for HTML/JS/CSS assets. A common pattern is to hash asset filenames (cache-busting) for static files, but still purge HTML files that reference them. If you're generating API responses cached at the CDN layer, surrogate keys let you invalidate by entity type rather than building URL inventories.

**SRE**: Purge storms are real. If a deploy triggers full-cache invalidation, origin traffic spikes sharply as every edge node re-fetches simultaneously — this can overwhelm origin if you're not capacity-planning for it. Mitigate with staggered rollouts, or keep a warm standby via `stale-while-revalidate`. Also watch CDN provider rate limits on purge API calls; bulk purges can be throttled.

**DevOps**: Integrate purge calls into your CD pipeline, not as an afterthought. Purge *after* origin is serving new content, not before — otherwise you race against origin rollout and edge nodes might re-cache the old version. Some teams version assets by content hash and only purge the index HTML, which is a solid middle ground between full busts and surgical purges.

### Common Pitfall

Treating purge as equivalent to "clear the cache." A purge removes the stored object, but if your TTL is short and origin is slow, you may have just moved a cache miss problem into prime time. Purging should be paired with thinking about what your origin can handle cold.
