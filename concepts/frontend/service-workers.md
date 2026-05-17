---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Service Workers

A Service Worker is a JavaScript file the browser registers and runs in a separate thread — no DOM access, no blocking the main thread — acting as a programmable proxy between your web app and the network. The core value proposition: you control what happens when your app makes a network request.

### The mechanism

After registration, the browser installs the service worker and it begins intercepting `fetch` events for requests from its scope (typically the origin). You get a `FetchEvent` with the full `Request` object, and you decide: hit the network, serve from cache, return a synthetic response, or do something else entirely. This happens outside the page lifecycle — the service worker persists even when the tab is closed.

The lifecycle is the tricky part. A service worker goes through `installing → waiting → active`. If a user has an old service worker active, a new version installs but won't activate until all tabs using the old one are closed. This trips up most people the first time they ship an update and wonder why nothing changed.

### Mental model

Think of it as Nginx for your browser. You're writing routing logic, cache policies, and fallback behavior — but client-side, per-origin. The `Cache API` is your backing store (key-value, request/response pairs), and you populate it during the `install` event by precaching critical assets.

```js
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached ?? fetch(event.request))
  );
});
```

Cache-first: serve from cache, fall back to network. Two lines of logic, but the implications are significant — your app now works without a connection.

### Where this matters in practice

**Frontend:** Offline-first PWAs. Cache your app shell during install, serve it immediately, then hydrate with fresh data when the network is available. This eliminates the blank screen on flaky connections.

**Fullstack:** Background sync lets you queue writes when offline and replay them when connectivity returns — without the user waiting around. Combined with push notifications (which also arrive via service workers, even when the tab is closed), you get a legitimate alternative to native apps for engagement-driven workflows.

### Common pitfalls

- **Cache invalidation**: If you cache aggressively without versioning, users get stale content indefinitely. Tie cache names to build hashes.
- **HTTPS required**: Service workers only register on secure origins (or localhost). Non-negotiable.
- **Scope mismatches**: A worker registered at `/app/sw.js` only controls requests under `/app/`. Unexpected behavior if your API is at `/`.
- **The waiting trap**: Calling `skipWaiting()` forces immediate activation, but can cause subtle inconsistencies if the old and new worker have different cache strategies mid-session.

The abstraction unlocks Cache API, Background Sync, and Push Notifications — all of which are useless without a service worker as the underlying runtime.
