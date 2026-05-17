---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

Cache-Control is an HTTP response header that instructs every cache layer — browser, CDN, reverse proxy — on what to cache, for how long, and under what conditions to revalidate. Getting these directives right is the difference between a fast app and stale data at scale.

## The core mechanism

Every HTTP response passes through a chain of caches. Each cache reads Cache-Control and decides: store this? serve it fresh? check origin? Directives apply to all caches unless you scope them — `private` means browser only, `s-maxage` overrides `max-age` for shared caches (CDNs) only.

The directives that actually matter:

- **`max-age=N`** — treat this response as fresh for N seconds. Both browser and CDN respect it.
- **`s-maxage=N`** — overrides max-age for shared caches only. Cache aggressively at the edge while keeping browser TTL shorter.
- **`stale-while-revalidate=N`** — serve the stale response immediately, fetch fresh in the background within N seconds. Eliminates the revalidation latency spike.
- **`stale-if-error=N`** — if origin returns 5xx, serve stale for up to N seconds. Your CDN becomes a buffer against origin failures.
- **`immutable`** — tells the browser this response will never change; skip revalidation even on hard reload. Only valid with content-addressed URLs (`main.abc123.js`).
- **`no-cache`** — does *not* mean "don't cache." It means revalidate with origin before serving. `no-store` is the actual "don't cache" directive.

## Mental model

Cache-Control is a trust contract. `max-age=0, no-cache` says "ask me every time." `max-age=31536000, immutable` says "this will never change." Most bugs come from either trusting too much (stale data) or too little (unnecessary origin load).

## Practical scenarios

**Backend:** For user-specific API responses, use `private, max-age=0, no-cache`. For a public pricing page updated every 5 minutes: `public, max-age=300, stale-while-revalidate=60` — CDN serves fast while background-refreshing near expiry.

**Frontend:** Bundled JS/CSS gets `public, max-age=31536000, immutable` — the content hash in the filename handles invalidation. The HTML entry point (`index.html`) needs `no-cache` so it always fetches fresh chunk references after a deploy.

**Fullstack:** The classic trap is setting a long CDN TTL on an API response, deploying, then wondering why the CDN still serves old data. The correct pattern is `s-maxage` with a CDN purge on deploy — you decouple CDN TTL from browser TTL and control invalidation explicitly.

---

The `no-cache` vs `no-store` confusion causes more misconfigured endpoints than anything else. To disable caching entirely, you need both: `Cache-Control: no-store, no-cache`.
