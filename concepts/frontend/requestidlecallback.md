---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## requestIdleCallback

`requestIdleCallback` lets you schedule non-critical work to run during the gaps when the browser's main thread has nothing else to do — specifically the slack time between completing one frame and starting the next. It's the cooperative alternative to just running expensive work and hoping it fits inside the frame budget.

### Core Mechanism

After the browser paints a frame, if there's remaining time before the next frame needs to start (under 16ms at 60fps), it will invoke any queued idle callbacks. Your callback receives a `deadline` object with two properties:

- `deadline.timeRemaining()` — milliseconds left in the current idle period (dynamically updated as you run)
- `deadline.didTimeout` — whether the browser forced the callback to run because your optional `timeout` expired

The canonical pattern for chunked work looks like this:

```js
function processQueue(deadline) {
  while (workQueue.length > 0 && deadline.timeRemaining() > 0) {
    processItem(workQueue.shift());
  }
  if (workQueue.length > 0) {
    requestIdleCallback(processQueue);
  }
}

requestIdleCallback(processQueue, { timeout: 2000 });
```

The `timeout` option is a safety valve: if idle time never materializes (sustained heavy load), the callback fires anyway with `didTimeout: true` — at that point you accept the jank risk rather than starve the work indefinitely.

### Mental Model

Think of a barista who does prep work (restocking, cleaning) only when there's no queue at the counter. They constantly check how much time they have before the next customer, and stop immediately when one arrives. The work still gets done, it just doesn't block service.

This is the explicit alternative to what Long Tasks API detects after the fact — instead of creating a long task that blocks the thread, you yield voluntarily and resume when safe.

### Practical Scenarios

**Frontend:**
- Prefetching route data or images the user is likely to need next
- Persisting draft content to `localStorage` without risking input lag
- Running client-side analytics or telemetry batching
- Pre-rendering off-screen content (virtual list rows, modal content)

**Fullstack:**
- In service workers: scheduling background sync or cache warming during idle periods
- Precomputing personalization data on page load without competing with the initial render
- Deferring non-critical indexedDB writes

### Watch Out For

- **No Safari support** — you need a `setTimeout`-based polyfill in production
- **Don't touch the DOM** in idle callbacks; layout queries or mutations can trigger additional work that blows past your deadline
- `timeRemaining()` can return close to 0ms immediately — your chunking logic needs to handle that gracefully, not assume you'll always get meaningful time
- Idle callbacks run at lower priority than `requestAnimationFrame`; if you need "soon but not critical," they're right; if you need "before next paint," you want rAF or a microtask

The key insight connecting back to the rendering pipeline: rIC is you explicitly participating in the browser's scheduling model rather than fighting it.
