---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Performance Observer API

The browser's performance timeline is a buffer of entries — navigation timing, resource loads, paint events, long tasks — and without `PerformanceObserver`, your only option is polling `performance.getEntries()` or hoping you checked the buffer before it rolled over. `PerformanceObserver` gives you a push-based subscription: the browser calls your callback as entries land, no polling, no missed entries.

**Core mechanism**

You create an observer with a callback, then call `.observe({ type: '...', buffered: true })`. The `buffered: true` flag is critical — it replays entries that already occurred before your observer registered, which matters because paint and navigation events often fire during or just after page load, before your JS has a chance to subscribe. The callback receives a `PerformanceObserverEntryList`, not a single entry, because the browser may batch multiple entries per callback invocation.

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.startTime, entry.duration);
  }
});

observer.observe({ type: 'longtask', buffered: true });
```

Entry types you'll actually use: `navigation`, `resource`, `paint` (FP/FCP), `largest-contentful-paint`, `longtask`, `layout-shift`, `first-input`. Each type exposes a different entry shape — `PerformanceLongTaskEntry` has a `attribution` array pointing at frames/scripts, `LayoutShiftEntry` has a `value` (the CLS contribution) and `hadRecentInput`.

**The mental model**

Think of it like a `MutationObserver` or `IntersectionObserver` — same pattern. You describe what you care about, the browser does the bookkeeping, you react to events. The alternative (polling `performance.now()` and diffing entries) is both unreliable and expensive.

**Where it matters in practice**

*Frontend:* This is the foundation of real user monitoring (RUM). Libraries like web-vitals.js are thin wrappers around `PerformanceObserver`. If you're instrumenting LCP, CLS, or FID/INP yourself rather than delegating to a library, you're writing `PerformanceObserver` subscriptions.

*Fullstack:* You probably aren't running this server-side, but you're likely consuming its output — RUM data sent via `navigator.sendBeacon` to your analytics endpoint. Understanding what each entry type actually measures (and its gotchas, like LCP being reportable multiple times as the largest candidate changes) helps you interpret that data correctly.

*SRE:* Long task detection is the practical path to diagnosing main-thread jank without a profiler attached. Logging entries with `attribution` in production gives you signal on which scripts are blocking — something synthetic monitoring often misses.

**Common pitfall:** `largest-contentful-paint` and `layout-shift` entries stop being dispatched once the user interacts with the page. If you're accumulating CLS, you need to finalize your score on `visibilitychange` or `pagehide`, not just sum entries indefinitely.
