---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Background Sync API

The Background Sync API lets a service worker defer a network operation until connectivity is available — even after the user has closed the tab. It's the piece that makes "works offline" actually mean "syncs offline changes," not just "reads cached data."

---

### Core mechanism

When you register a sync event, you're telling the browser: *"next time you have a stable connection, wake up my service worker and fire this event."* The browser owns retry logic, handles exponential backoff, and survives tab closure. You register in the page, but execution happens in the service worker — potentially long after the page is gone.

This is the key distinction from rolling your own reconnect logic: a `navigator.onLine` listener or a retry loop dies when the page closes. The browser's sync queue doesn't.

```js
// In the page
await navigator.serviceWorker.ready;
await registration.sync.register('submit-form');

// In the service worker
self.addEventListener('sync', event => {
  if (event.tag === 'submit-form') {
    event.waitUntil(flushPendingSubmissions());
  }
});
```

Two flavors exist: **one-off sync** (fires once on next connectivity) and **periodic sync** (fires on a schedule, requires explicit user permission — appropriate for background news fetching or feed refreshes).

---

### Mental model

Think of it as a message queue where the browser is the queue manager. You drop a sync request in. The browser decides when conditions are right — online, not metered, battery sufficient — then invokes your service worker to process it. You don't poll, you don't manage timers, you just handle the event.

---

### Practical scenarios

**Frontend:** User submits a form on a shaky mobile connection. Instead of showing an error, you write the payload to IndexedDB and call `sync.register('form-submit')`. The browser fires the sync event when connectivity recovers — even if they've locked their phone and walked away. No retry UI, no lost submissions.

**Fullstack:** An event-tracking pipeline where losing a single flush is acceptable but you still want best-effort delivery. Register a sync per batch; the service worker sends it when the browser decides it's safe. Your backend should be idempotent on ingestion — the same sync tag can fire multiple times if the handler throws and the browser retries.

---

### Why this unlocks offline-first design

Without Background Sync, "offline-first" usually means read-only resilience. Cached data loads, but writes silently fail or require the user to be online. Background Sync makes the write path durable — local mutations queue up and propagate automatically, without the app managing that lifecycle.

**Caveat worth knowing:** support is solid in Chrome/Edge but still limited in Safari (as of 2025). Treat it as progressive enhancement — use it when available, fall back to a visible retry mechanism otherwise.
