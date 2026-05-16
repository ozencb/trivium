---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Performance Observer API

The Performance Observer API is a push-based interface for subscribing to browser performance timeline entries as they're emitted, rather than polling a static snapshot. It's the foundation under everything from Core Web Vitals measurement to custom RUM instrumentation.

### Core Mechanism

The browser maintains an internal **performance timeline** — a growing log of typed entries produced by the rendering pipeline, network stack, and JavaScript engine. These include resource loads, paint events, long tasks, layout shifts, and more. Before PerformanceObserver, you could only pull from this log synchronously via `performance.getEntriesByType()`. The problem: you had to know when to ask, and you'd miss entries that occurred before your code ran.

PerformanceObserver flips this to a subscriber model. You declare which entry types you care about, register a callback, and the browser invokes it whenever matching entries land in the timeline:

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.startTime, entry.duration);
  }
});

observer.observe({ type: 'largest-contentful-paint', buffered: true });
```

The `buffered: true` flag is non-obvious but critical: the browser buffers entries from before your observer registered, so you don't miss events that fired during early page load before your script executed.

### Mental Model

Think of it like a database trigger vs. a polling query. `performance.getEntriesByType()` is `SELECT * FROM timeline WHERE type = 'paint'` run on demand. PerformanceObserver is `AFTER INSERT ON timeline WHERE type = 'paint' CALL myCallback()`. The browser does the work; you react.

### Practical Scenarios

**Frontend:** This is how `web-vitals.js` works under the hood. LCP uses the `largest-contentful-paint` entry type, CLS uses `layout-shift`, INP uses `event`. If you've ever integrated that library and wondered why it seems to "just know" when things happen — it's registering observers during module initialization, with `buffered: true`, so nothing slips through.

**Fullstack:** Instead of batching perf data at page unload (which is lossy — unload fires inconsistently on mobile), you can beacon individual entries to your analytics endpoint as they occur. A single `resource` observer lets you track third-party script load times in real time and fire alerts if a CDN degrades mid-session.

**SRE:** Most RUM vendors (Datadog, Sentry, Dynatrace) are thin wrappers around PerformanceObserver. Knowing the raw API lets you audit what they're actually capturing, explain discrepancies between their dashboards and your own metrics, or add custom `performance.mark()` / `performance.measure()` instrumentation that feeds into your existing pipeline without a second SDK.

### Why It Matters Going Forward

Each of the APIs this unlocks — Paint Timing, Long Tasks, Resource Timing — are just specific entry types surfaced through this same observer interface. Once you understand the subscription model and the `buffered` flag behavior, those APIs are mostly just documentation lookups for which entry type to observe.
