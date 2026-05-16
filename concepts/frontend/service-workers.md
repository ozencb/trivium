---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Service Workers are JavaScript files that run in a background thread separate from the main browser tab — acting as a programmable proxy between your web app and the network.

## The Core Mechanism

Unlike regular JS, a Service Worker has no DOM access and runs in its own thread with a different lifecycle than your page. The key insight: it intercepts `fetch` events. Every network request your page makes passes through the Service Worker's `fetch` handler first. You decide what happens — serve from cache, hit the network, or some combination.

The lifecycle is the part most people initially misunderstand:

1. **Register** — your page installs the SW (once, or when it changes)
2. **Install** — SW installs, you typically pre-cache static assets here
3. **Activate** — SW takes control, you clean up old caches here
4. **Idle / Fetch** — SW intercepts requests while active

A crucial detail: a new SW won't activate until all tabs using the old one are closed. This is intentional — no half-deployed states.

## Mental Model

Think of it as a local reverse proxy running inside the browser. When you hit `nginx` in production, it can cache responses, rewrite URLs, serve stale-while-revalidate. A Service Worker does the same thing, but client-side, per-user, with full JS expressiveness.

```js
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached ?? fetch(event.request);
    })
  );
});
```

That's cache-first in ~5 lines. If the asset is cached, return it immediately. Otherwise hit the network.

## Practical Scenarios

**Frontend:** You ship a dashboard-heavy app. Without a SW, slow connections mean blank screens during load. With one, you pre-cache your shell (HTML, JS bundles, fonts) during install. First paint is instant from cache; data fetches go to the network as normal. Users on flaky connections stop complaining.

**Fullstack:** You're building a field-data entry app used in warehouses with spotty WiFi. The SW intercepts POST requests when offline, queues them via Background Sync, and replays them when connectivity returns. Your server never needed to change — the SW handles the offline/online bridging entirely on the client.

## What Makes It Different

The Service Worker is persistent across page loads and survives the tab closing (it can wake up for push events or sync). This is what enables Web Push Notifications — the SW receives the push message even when the site isn't open.

It requires HTTPS (or localhost), which is intentional: a network-level proxy that can rewrite responses is a significant security surface.

The SW is essentially the missing piece that lets web apps match native app capabilities — offline support, background tasks, push — without an app store.
