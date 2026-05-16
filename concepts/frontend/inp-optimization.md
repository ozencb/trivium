---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Interaction to Next Paint (INP) Optimization

INP measures the full latency between a user interaction and the next frame the browser actually paints in response. It replaced FID as a Core Web Vital because FID only measured *input delay* — the wait before event handlers even started — while INP captures the complete round-trip: delay + processing + rendering.

### The Core Pipeline

Every interaction goes through three phases:

1. **Input delay** — time from interaction to when the browser starts running your event handlers (blocked by other tasks on the main thread)
2. **Processing time** — your event handler(s) executing
3. **Presentation delay** — browser layout, style recalculation, and paint after handlers finish

INP is the 98th percentile of all interaction latencies in a session. Good is ≤200ms. The budget is small, and all three phases eat into it.

### Where It Actually Goes Wrong

The most common culprit isn't slow event handlers — it's **input delay from long tasks**. If a user clicks while a 400ms JS chunk is executing (hydration, a data transform, a library init), their interaction sits queued until that task finishes. The handler might only take 5ms, but INP shows 400ms.

Mental model: the main thread is a single-lane road. Any long task blocks everything queued behind it, including the browser's own paint work.

### Practical Fixes

**Frontend:**
- Break up long tasks with `scheduler.yield()` (or `await new Promise(r => setTimeout(r, 0))` as a fallback) — this gives the browser a chance to handle pending interactions between chunks
- In React, wrap non-critical state updates in `startTransition` so React deprioritizes that rendering work
- Virtualize large lists — painting 10,000 rows on a button click will destroy presentation delay
- Avoid reading layout properties (`.offsetHeight`, `.getBoundingClientRect()`) after DOM writes in the same handler — forces a synchronous reflow

**Fullstack:**
- Server-driven UI updates (HTMX, Turbo, RSC) can shift work off the main thread, but the HTML swap still triggers layout — keep response payloads lean
- If a mutation triggers a data refetch that re-renders a large tree, the INP cost is in the presentation delay of that re-render, not the network. Profile with `PerformanceObserver` and the `event` entry type, not just the Network tab

### Debugging It

The Long Tasks API will show you tasks >50ms, but for INP specifically, use the `PerformanceObserver` with `type: 'event'` and `durationThreshold: 100`. Chrome DevTools' Performance panel now annotates INP candidates directly. Field data from CrUX will often surface interactions your lab testing misses entirely.
