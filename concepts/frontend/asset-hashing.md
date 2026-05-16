---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Asset Hashing and Cache Busting

Asset hashing embeds a content-derived fingerprint into asset filenames so that any change to a file produces a new URL, forcing browsers and CDNs to fetch fresh content rather than serve a stale cache. It's the standard solution to the tension between aggressive HTTP caching and the need to ship updates.

**The core mechanism**

HTTP caching keys on URL. A browser that has `main.js` cached won't re-fetch it until the TTL expires—regardless of what changed server-side. The naive fix is short TTLs, but that trades correctness for performance: every load hits the server even for unchanged files.

Asset hashing inverts the tradeoff: set immutable, year-long TTLs on assets, and encode freshness in the filename itself. Your bundler computes a hash of each asset's content and injects it: `main.a3f8c912.js`. The entry HTML (served with `no-cache` or a very short TTL) always references the latest hashes. Unchanged files keep the same hash across deploys—their cached versions remain valid. Changed files get new hashes—new URL, cache miss, fresh fetch.

**Mental model:** it's content-addressed storage, same idea as how git addresses blobs. The URL *is* the cache key *and* encodes freshness. If content didn't change, the URL didn't change; if the URL didn't change, the cached version is correct by definition.

**Frontend specifics**

In webpack, `output.filename: '[name].[contenthash].js'` generates per-chunk hashes based on module content. `contenthash` is module-graph-aware—adding a new route chunk doesn't rehash your vendor bundle, so users keep that cached. Using `hash` (build-level) instead would invalidate everything on any change, which defeats the purpose.

Vite and Rollup do the same. Images and fonts get hashed filenames too, so a logo won't re-download until the actual pixels change.

**Fullstack specifics**

Your server serves the HTML entry point with `Cache-Control: no-cache`. The HTML references hashed asset paths. CDN or browser caches apply long TTLs only to those hashed paths—marked `immutable` if you want to be explicit.

In Next.js, this is automatic: `_next/static/chunks/main-abc123.js` gets `Cache-Control: public, max-age=31536000, immutable`. The HTML pages themselves get shorter TTLs or ISR revalidation. You never need to manually invalidate CDN caches for static assets—you never overwrite a file in place, you publish a new-hash filename alongside the old one.

One practical consequence: zero-downtime deploys are easier. During a deploy window where both old and new HTML might be served, old clients still reference old hashed filenames that remain valid on the CDN. No race condition where a client fetches new HTML but gets old, now-overwritten JS.
