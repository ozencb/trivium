---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Background Sync API

Background Sync lets a service worker defer network requests until connectivity is reliable, so user actions taken offline don't silently disappear. It solves the gap between "the user did something" and "the server knows about it" — without making the user wait or retry manually.

### Core Mechanism

You register a sync tag from your page, and the browser guarantees the service worker's `sync` event fires at least once when the device has connectivity — even if the tab is closed by then. The key word is *guarantees*: the browser owns the retry schedule, handles exponential backoff, and persists the registration across browser restarts (on supporting platforms).

```js
// In your page
await navigator.serviceWorker.ready;
await registration.sync.register('submit-form');

// In your service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'submit-form') {
    event.waitUntil(flushQueuedRequests());
  }
});
```

The contract: if `flushQueuedRequests()` rejects, the browser retries. If it resolves, the sync is done. You're responsible for storing the pending payload (IndexedDB is the right tool) and replaying it when the sync fires.

### Mental Model

Think of it as a post office drop box. You put mail in when you want (offline, poor signal, mid-tunnel). The post office decides when to actually send it. You don't poll; you just trust delivery will happen.

### Practical Scenarios

**Frontend:** A note-taking app where the user edits offline. Instead of blocking on a failed `fetch`, you save the diff to IndexedDB and register a sync tag. When connectivity returns, the service worker replays the diff. The user never saw a spinner or an error.

**Fullstack:** A form submission in a Progressive Web App. The server needs to receive exactly one copy — so your `flushQueuedRequests` must be idempotent (include a client-generated request ID). The server deduplicates; Background Sync handles the retry transport.

### Common Pitfalls

- **No IndexedDB, no sync.** If you don't persist the payload before registering the tag, a page reload before the sync fires loses the data entirely.
- **Idempotency is your problem.** Background Sync may fire multiple times if the service worker crashes mid-flight. Design your endpoints accordingly.
- **Limited browser support.** As of 2026, it's Chromium-only. Safari and Firefox don't support it, which makes it a progressive enhancement rather than a baseline. Always have a fallback (optimistic UI + retry on next load).
- **Not for periodic background work.** That's Periodic Background Sync, a separate API with stricter permission requirements.

### When to Reach For It

Reach for it when user actions must eventually reach the server and the user shouldn't have to think about connectivity. Skip it when your app is purely online, or when you need cross-browser reliability today — in that case, a simpler `online` event listener with a request queue gets you most of the way there.
