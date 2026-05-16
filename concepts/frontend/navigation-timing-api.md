---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Navigation Timing API

The Navigation Timing API exposes a detailed timestamp breakdown of every phase in a page load — DNS lookup, TCP handshake, TTFB, DOM parsing, load event — directly from the browser. It's how you move from "the page feels slow" to "the page is slow because DNS took 400ms and TTFB was 800ms."

### Core Mechanism

The API gives you a single `PerformanceNavigationTiming` entry (accessible via `performance.getEntriesByType('navigation')[0]`). It's a timeline of monotonic timestamps covering the full navigation lifecycle:

```
fetchStart → domainLookupStart → domainLookupEnd
          → connectStart → secureConnectionStart → connectEnd
          → requestStart → responseStart → responseEnd
          → domInteractive → domContentLoadedEventEnd
          → domComplete → loadEventEnd
```

Each timestamp is a `DOMHighResTimeStamp` relative to the page's time origin. The useful signal comes from *subtracting* them:

```js
const nav = performance.getEntriesByType('navigation')[0];

const ttfb = nav.responseStart - nav.requestStart;
const dnsLookup = nav.domainLookupEnd - nav.domainLookupStart;
const tcpHandshake = nav.connectEnd - nav.connectStart;
const domProcessing = nav.domComplete - nav.responseEnd;
```

This entry extends `PerformanceResourceTiming`, so it fits naturally into the `PerformanceObserver` pipeline you already know — observe `'navigation'` type entries the same way you'd observe `'resource'`.

### Mental Model

Think of it as a network waterfall chart (like the one in DevTools Network tab) but available programmatically at runtime, from real users' browsers. DevTools shows you *your* load on *your* machine. Navigation Timing gives you the same data from every user session.

### Practical Scenarios

**Frontend:** Build a lightweight RUM snippet that fires on `load`, captures the navigation entry, and sends derived metrics (TTFB, DNS, DOM interactive time) to your analytics endpoint. This is what Datadog RUM and Sentry Performance do under the hood.

**Fullstack:** TTFB (`responseStart - requestStart`) is your server's responsibility. If it's high, the problem is backend — SSR render time, DB queries, or cold starts — not asset delivery. Navigation Timing lets you triage network vs. server vs. client-side parsing without guessing.

**SRE:** Set up alerting on p95 TTFB degradation using aggregated RUM data. A spike in `connectEnd - connectStart` across users might reveal a TCP saturation issue at the load balancer before any synthetic monitor catches it, since synthetics run from known locations on fast connections.

### One Gotcha

`redirectStart`/`redirectEnd` will be zero if the redirect crosses origins (due to the Timing-Allow-Origin header restriction). Cross-origin redirects are a common source of phantom "fast" numbers that don't match user experience.
