---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## requestIdleCallback

The browser's main thread is a single-lane road: rendering, event handling, and JavaScript all share it. `requestIdleCallback` gives you a formal way to schedule work *only* when that road is empty — after the current frame has painted and before the next one is due.

**The mechanism**

The browser calls your callback with a `deadline` object exposing `timeRemaining()` (milliseconds left in the idle period) and `didTimeout` (whether your optional `timeout` option fired). Idle periods are typically the slack between a 16ms frame budget and however long rendering actually took. On a lightly-loaded page you might get 40–50ms chunks; on a busy one, barely any. The API signals you should *check before each unit of work*, not assume the whole budget is yours.

```js
function processChunk(deadline) {
  while (deadline.timeRemaining() > 1 && queue.length > 0) {
    doExpensiveWork(queue.shift());
  }
  if (queue.length > 0) {
    requestIdleCallback(processChunk, { timeout: 2000 });
  }
}
requestIdleCallback(processChunk, { timeout: 2000 });
```

The `timeout` fallback matters: without it, a constantly busy page might never call your callback. With it, the browser will fire it even mid-frame if the deadline passes — which means you can't assume `timeRemaining()` > 0 when `didTimeout` is true. Check both.

**Mental model**

Think of it like a restaurant kitchen during a dinner rush. You wouldn't deep-clean the prep station mid-service. You wait for a lull, do one tray's worth of cleaning, then check if another lull is coming. `requestIdleCallback` is the lull-detector.

**Practical scenarios**

*Frontend:* Prefetching routes or serializing analytics events. After a page transition, the user's reading; you can quietly preload their likely next destination without competing with paint. Also useful for lazy-hydrating below-fold components — don't pay the JS cost until the browser has breathing room.

*Fullstack:* If you're running a Next.js or Remix app with significant client-side state, idle callbacks pair well with background sync patterns — flushing local draft saves to the server, revalidating stale cache entries, or warming up a Wasm module after the initial render settles.

**When not to reach for it**

Avoid it for anything time-sensitive or user-triggered — click handlers, form validation, or anything that feeds visible state. Also avoid it in Safari before iOS 18; the API wasn't supported until late 2024, so you'll need a `setTimeout`-based polyfill for broader support. And don't treat it as a general "make this async" escape hatch — if a task genuinely blocks the thread for 200ms, chunking it with `requestIdleCallback` is only half the fix; the chunking strategy itself needs thought (this is where Long Tasks API telemetry tells you if you actually solved the problem).
