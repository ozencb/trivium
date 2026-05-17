---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Paint Timing API

The Paint Timing API gives you precise timestamps for when the browser first put any pixels on screen (First Paint) and when it rendered the first meaningful content (First Contentful Paint). Without it, you're guessing at render performance from synthetic benchmarks; with it, you get real user measurements from production traffic.

### Core mechanism

The browser emits two `PerformanceEntry` events during page load: `first-paint` (FP) and `first-contentful-paint` (FCP). FP fires when *anything* is drawn — even a background color change. FCP fires when the first DOM content (text, image, SVG, canvas) is painted. The delta between them is often small, but a large gap signals the browser painted a blank-ish frame first, which users perceive as a flash of nothing.

You consume these via `PerformanceObserver`:

```js
new PerformanceObserver((list) => {
  for (const entry of list.getEntriesByType('paint')) {
    console.log(entry.name, entry.startTime); // 'first-paint', 'first-contentful-paint'
  }
}).observe({ type: 'paint', buffered: true });
```

The `buffered: true` is critical — without it, you miss entries that fired before your observer registered, which happens constantly on fast connections.

### Practical mental model

Think of FCP as the user's "is this working?" signal. If FCP is at 3s, the user has been staring at a blank screen for 3 seconds wondering if the site is broken. FCP doesn't measure *usefulness* — that's LCP's job — but it measures *responsiveness*.

### By role

**Frontend:** Use FCP to catch regressions introduced by render-blocking resources. A new third-party script added to `<head>` will push FCP measurably. Track FCP per route — a slow FCP on `/checkout` is more damaging than on `/about`.

**Fullstack:** FCP is a server-side proxy too. High TTFB (slow server response) directly delays FCP because the browser can't paint DOM content it hasn't received. If FCP degrades after a backend deploy, the root cause is often there, not in the JS.

**SRE:** Aggregate FCP as a p75/p95 metric in your RUM pipeline (Datadog, New Relic, or a custom beacon). Spike in p95 FCP during a deployment window is an early signal of user-visible degradation, often before error rates move. Segment by region and device class — FCP on a mid-range Android on 4G will look completely different than desktop Chrome on fiber.

### Common pitfalls

- Treating FP and FCP as interchangeable — they're not; FP can fire on a blank white flash.
- Not bucketing by connection type or device memory; averages hide the worst-case user experience.
- Forgetting `buffered: true` and silently collecting no data.

FCP is your first checkpoint on the path to understanding LCP — if FCP is slow, LCP will be slow by definition.
