---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Paint Timing API

The Paint Timing API exposes timestamps for when the browser first renders pixels to the screen, giving you ground truth about perceived load speed rather than network or JS execution times. It exists because users experience paint events, not DOMContentLoaded.

### Core mechanism

The browser distinguishes two paint milestones:

- **First Paint (FP)** — any visual change from a blank screen (even a background color)
- **First Contentful Paint (FCP)** — the first render of actual content: text, image, SVG, or non-white canvas

These are exposed via the `PerformanceObserver` API with the entry type `"paint"`. The timestamps are relative to the [navigation start](https://www.w3.org/TR/navigation-timing/) — the same epoch as everything else in the Performance Timeline, so you can correlate them with TTFB, resource timing, and long tasks without unit mismatch.

```js
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.startTime); // "first-paint", "first-contentful-paint"
  }
});
observer.observe({ type: "paint", buffered: true });
```

`buffered: true` is critical — paint events often fire before your observer is attached, and without it you miss them entirely.

### Mental model

Think of FP and FCP as two different answers to "is something happening?" FP answers "did anything change?" (the white screen is gone). FCP answers "did the user see real content?" (not just a spinner or background). The gap between them tells you how long your loading skeletons or spinners are showing — which is often longer than you think.

### Practical relevance

**Frontend:** FCP is your primary signal for render-blocking resources. If FCP is high, look at what's in the critical rendering path — blocking scripts, render-blocking CSS, or large synchronous font loads. FCP directly feeds into Lighthouse scores and Core Web Vitals reporting.

**Fullstack:** Server-rendered apps (Next.js, Remix, Rails) typically have better FCP than SPAs because HTML arrives with content. But if your server response is slow or your HTML is large, FCP degrades even with SSR. Monitoring FCP alongside TTFB tells you whether the bottleneck is server or client-side render work.

**SRE:** FCP is a user-facing SLI you can actually instrument in RUM (Real User Monitoring). Unlike synthetic probes that measure from a datacenter, Paint Timing data collected from real browsers captures CDN cache misses, slow mobile networks, and resource contention. You can feed it into your SLO dashboards via the Beacon API or a RUM service and alert on p75/p95 regressions across regions or device classes.

FCP is also the conceptual foundation for LCP (Largest Contentful Paint) — LCP extends the same idea by tracking not just the first content render, but the largest element, which correlates more strongly with perceived load completion.
