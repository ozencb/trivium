---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Interaction to Next Paint (INP) Optimization

INP measures the full latency of an interaction — from the moment a user clicks, taps, or presses a key, to when the browser finishes painting the resulting visual update. It replaced FID as a Core Web Vital because FID only measured *input delay* (how long before the event handler started), while INP captures the entire pipeline: input delay + event handler execution + presentation delay.

### The Core Mechanism

The browser's main thread is a single queue. INP breaks down into three phases:

1. **Input delay** — main thread is occupied with something else when the event fires
2. **Processing time** — your event handlers run
3. **Presentation delay** — style recalc, layout, paint, composite

INP is the worst-case interaction observed across the session (technically the 98th percentile). The target is under 200ms total. Most teams discover they're failing INP not because of slow event handlers, but because a long task is *already running* when the user clicks — so the event waits in the queue.

### The Mental Model

Think of the main thread as a single cashier. If the cashier is in the middle of processing a 600ms inventory report when you walk up, you wait the full 600ms before they even acknowledge you. Your click didn't cause the delay — the unrelated work did. This is why "my click handler is fast" is often a red herring.

### Common Patterns

**Yield to the browser between chunks of work.** Instead of doing 400ms of work synchronously, break it with `scheduler.yield()` (or the older `setTimeout(0)` fallback). This lets pending input events jump the queue.

```js
for (const item of largeList) {
  process(item);
  if (needsYield()) await scheduler.yield(); // browser can handle clicks here
}
```

**Defer non-visual work out of event handlers.** If a click triggers an analytics call and a DOM update, do the DOM update synchronously and push the analytics into a microtask or `requestIdleCallback`.

**React's `startTransition`** marks state updates as interruptible — React can abandon a render mid-flight to handle urgent user input, which directly improves INP for expensive re-renders.

### When to Reach for This

**Frontend:** Any interaction on a data-heavy dashboard, rich text editor, or virtualized list. If users complain about "sluggish" UI even on fast machines, INP is usually the culprit — not network.

**Fullstack:** Server-side rendering that produces large DOMs (>1500 nodes) inflates presentation delay on interactions because style recalculation is proportional to DOM size. Streaming SSR helps here.

The Chrome DevTools Performance panel now labels INP candidates directly — look for long tasks that overlap with user interactions, not just standalone slow tasks.
