---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

PWAs are the browser's answer to the question: *why do native apps get to live on the home screen and work offline?* They're not a single API — they're a deployment posture: serve over HTTPS, register a service worker, and ship a manifest. That combination unlocks platform-level capabilities the browser otherwise withholds.

**The core mechanism**

The service worker is the load-bearing piece. It's a proxy that sits between your app and the network, controlling every fetch. On install, you populate a cache; on subsequent requests, your strategy (cache-first, network-first, stale-while-revalidate) determines what the user sees. The manifest tells the OS how to represent your app — icon, name, display mode (`standalone` removes browser chrome), start URL, theme colors. Together, browsers use these signals to offer "Add to Home Screen" prompts and enable push notifications via the Push API + Notification API.

**Mental model**

Think of a service worker as a shared worker that never dies between page loads but *does* restart between browser sessions. It holds no DOM reference. Its lifecycle is: `install → activate → fetch/push/sync`. The tricky part is cache versioning — on deploy, you bump a cache name, the new SW installs alongside the old one, and only takes over once all old tabs are closed (`skipWaiting` forces the handoff immediately, but that can cause subtle state mismatches if the old and new SW versions expect different data shapes).

**Where this matters in practice**

*Frontend:* The `workbox` library handles most service worker boilerplate (cache strategies, precaching, background sync). You rarely write raw SW code. The real judgment call is cache strategy per route: static assets → cache-first with long TTL; API responses → network-first with fallback; user-generated content → stale-while-revalidate.

*Fullstack:* PWAs change your deployment contract. Push notifications require a VAPID key pair server-side; you store subscription objects in your DB and send via the Web Push protocol. Background sync lets you queue mutations offline and flush when connectivity returns — but your backend needs to be idempotent, because sync retries. If you're building something like a field-service app, a note-taking tool, or anything used in spotty connectivity, PWA is the right reach.

**Senior-level differentiation**

Where engineers trip up: assuming "PWA = offline support" is free. Cache invalidation is hard. Serving stale HTML while the JS changes can break your app silently. The correct pattern is to cache the app shell separately from content, and use versioned cache keys tied to deployments.

In design discussions, the real question isn't "should we build a PWA?" — it's "what's our offline story, and is the complexity worth it vs. just a native app?" For B2C web products with mobile traffic, PWA is almost always worth it. For internal tooling or desktop-first products, often not.
