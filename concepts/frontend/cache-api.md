---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

The Cache API is a programmatic interface for storing and retrieving `Request`/`Response` pairs in the browser's persistent cache — separate from the HTTP cache and fully under your control. It exists because Service Workers need a way to intercept network requests and serve responses offline, and the browser's automatic HTTP cache offers no JavaScript API to do that.

## Core mechanism

The Cache API exposes named cache stores, each holding a map of `Request` → `Response` entries. Unlike `localStorage`, it's async and designed for HTTP semantics — you store actual `Response` objects (with headers, status codes, bodies), not serialized strings.

```js
const cache = await caches.open('v1');
await cache.put('/api/data', new Response(JSON.stringify({ok: true})));

const match = await cache.match('/api/data');
const body = await match.json(); // {ok: true}
```

`caches.open()` creates the named cache if it doesn't exist. Keys are `Request` objects (or URLs coerced into them); matching is done by URL and optionally method/headers via `CacheQueryOptions`.

The API lives on both `window` and inside Service Workers. That's the point — a Service Worker intercepts a `fetch` event, checks the cache first, falls back to the network, and optionally stores the response for next time:

```js
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => 
      cached ?? fetch(event.request).then(res => {
        const clone = res.clone(); // Response body is a stream, can only be consumed once
        caches.open('v1').then(cache => cache.put(event.request, clone));
        return res;
      })
    )
  );
});
```

The `clone()` call is the non-obvious part: `Response` bodies are streams that can only be read once. You cache the clone and return the original (or vice versa).

## Practical scenarios

**Frontend:** PWA offline support is the canonical use case. Cache shell assets (`index.html`, JS bundles, CSS) during install, serve them from cache-first, update them in the background. Users get instant loads and an offline fallback. You control cache versioning by naming caches (`v1`, `v2`) and deleting old ones during the `activate` event.

**Fullstack:** Useful when you're generating expensive API responses that don't change often — e.g., a product catalog. The Service Worker can serve stale content immediately while revalidating in the background (stale-while-revalidate pattern). This removes the cold-start latency penalty for authenticated SPAs where HTTP cache headers aren't set or where the response must not be shared across users.

The main footgun is cache invalidation (which you already know is hard). The Cache API gives you no TTL mechanism — you own expiration logic entirely. Every cache entry you write stays until you explicitly delete it or the browser evicts under storage pressure.
