---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Cache API

The Cache API is a programmable request/response store — a persistent key-value map where `Request` objects are keys and `Response` objects are values. It exists because service workers intercept network traffic but need somewhere to store what they've already fetched; the Cache API is that storage layer, scoped to your origin and surviving across page loads and browser restarts.

### Core mechanism

Unlike the browser's implicit HTTP cache (governed by `Cache-Control` headers and ETags), the Cache API gives you explicit control. You decide what to store, when to invalidate it, and what cache-busting logic looks like. The API is straightforward:

```js
const cache = await caches.open('app-v2');
await cache.put(request, response);
const cached = await cache.match(request);
await cache.delete(request);
await caches.delete('app-v1');
```

One non-obvious detail: `Response` bodies are streams and can only be consumed once. If you `cache.put(req, res)` and then try to read `res.json()`, you'll get nothing. Clone before storing:

```js
cache.put(request, response.clone());
return response;
```

### Mental model

Think of it as a programmable CDN edge cache that runs in the browser — you write the caching logic that a CDN's config language would otherwise express. You're the one implementing TTLs, versioning, and eviction.

### Practical patterns

**Cache versioning on deploy**: Name caches with a version string (`app-v2`). In the service worker's `install` event, pre-populate the new cache. In `activate`, delete all caches that don't match the current version. This gives you atomic cache rollover — old tabs keep using `app-v1` until they reload.

**Stale-while-revalidate for assets**: Serve immediately from cache, kick off a network fetch in parallel, and update the cache when it resolves. Users get instant loads; assets stay fresh without blocking.

**Network-first with cache fallback for APIs**: Try the network, fall back to cache if offline. Useful for dashboards where slightly stale data beats an error page.

### Where it fits in your stack

For **frontend work**, the Cache API is the engine behind offline-first PWAs and fast repeat loads. The high-level Workbox library wraps it with pre-built strategies, but understanding the API directly is worth it when you need to cache authenticated responses, handle partial updates, or debug why something is serving stale data.

For **fullstack**, it's relevant when your backend-controlled caching (Redis, CDN) doesn't extend to the client — the Cache API fills that gap for assets and read-heavy API routes, reducing origin load without a CDN contract.

### Common pitfall

The biggest one: forgetting that `cache.match()` is an exact URL match by default. Query parameters, trailing slashes, and fragment identifiers all count. If your app adds cache-busting params dynamically, `match()` will miss the cached entry every time unless you normalize keys explicitly.
