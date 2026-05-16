---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Cache-Control and HTTP Caching

HTTP caching is a protocol-level mechanism where responses carry instructions that tell browsers, proxies, and CDNs how to store and reuse them. `Cache-Control` is the header that carries those instructions — it's the contract between your server and every cache layer in the request path.

### Core Mechanism

When a response includes `Cache-Control`, every intermediary (browser, CDN edge node, reverse proxy) uses it to decide three things: *can I store this*, *how long is it fresh*, and *must I revalidate before serving it*. The directives compose:

- `max-age=N` — treat this response as fresh for N seconds after receipt
- `s-maxage=N` — same, but only for shared caches (CDNs, proxies); overrides `max-age` for them
- `no-store` — don't cache at all, ever
- `no-cache` — store it, but always revalidate with the origin before serving (despite the misleading name)
- `private` — only browser-local caches may store this; CDNs must not
- `must-revalidate` — once stale, don't serve stale under any circumstances (no "best-effort" staleness)
- `stale-while-revalidate=N` — serve stale while fetching fresh in the background for N seconds

Revalidation works via conditional requests: the browser sends `If-None-Match` (with the stored `ETag`) or `If-Modified-Since`, and the server replies `304 Not Modified` if nothing changed — no body transmitted.

### Mental Model

Think of `Cache-Control` as a TTL + policy label on a physical document. `max-age` is the expiry date. `no-cache` is a sticky note saying "check with HQ before you hand this out." `private` is a stamp saying "not for the public filing room." The document still travels to the filing room (CDN), but the stamp tells it to be discarded immediately.

### Practical Scenarios

**Backend**: API responses that are user-specific should carry `Cache-Control: private, max-age=0` to prevent CDNs from serving one user's data to another. For public, slow-changing data (product catalog, config), `Cache-Control: public, s-maxage=3600, stale-while-revalidate=60` lets CDNs serve stale instantly while refreshing asynchronously.

**Frontend**: Static assets built with content-hashed filenames (e.g., `app.3f2a1b.js`) can use `Cache-Control: public, max-age=31536000, immutable` — the hash changes when content changes, so an infinite TTL is safe. HTML entry points, which reference those assets, should use `no-cache` so browsers always revalidate them.

**Fullstack**: A Next.js or Remix app serving SSR pages needs careful differentiation — the HTML might need `private, no-cache` while the JS chunks it references get `immutable`. Getting this wrong causes either stale UIs or unnecessary origin load.

The most common mistake is conflating `no-cache` (revalidate always) with `no-store` (never store). The former enables conditional requests and saves bandwidth; the latter eliminates caching entirely.
