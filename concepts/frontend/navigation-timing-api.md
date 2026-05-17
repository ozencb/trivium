---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Navigation Timing API

The Navigation Timing API exposes a high-resolution timestamp for every discrete phase a browser goes through to load a page — DNS lookup, TCP handshake, TLS negotiation, redirect chains, server response, DOM parsing, and more — all accessible from JavaScript after the fact. It's how you stop guessing whether "slow page loads" are a network problem, a TTFB problem, or a client-side rendering problem, using data from actual users rather than synthetic Lighthouse runs.

### The Core Mechanism

The browser populates a `PerformanceNavigationTiming` entry (a subclass of `PerformanceResourceTiming`) on the global performance timeline. Unlike the old `window.performance.timing` object (deprecated), this entry is accessed via `PerformanceObserver` or `performance.getEntriesByType('navigation')`. Every timestamp is in milliseconds relative to the time origin, and the phases are additive — `connectEnd - connectStart` gives you TCP handshake time, `responseStart - requestStart` gives you TTFB, and so on.

Key timestamps to know:

- `fetchStart` — when the browser actually starts the navigation (post-redirect, post-cache-check)
- `domainLookupStart/End` — DNS resolution window
- `connectStart/End` + `secureConnectionStart` — TCP + TLS
- `requestStart` / `responseStart` — wire time to first byte
- `responseEnd` — full response received
- `domContentLoadedEventEnd` — parser done, deferred scripts run
- `loadEventEnd` — everything including images, subresources

### Concrete Mental Model

Think of it as a flight's black box for a single page load. The airport departure board (Lighthouse) tells you the scheduled time; Navigation Timing tells you exactly when the plane left the gate, when it hit the runway, when it lifted off, and when it landed — for every flight, not just a test run.

### Practical Scenarios

**Frontend:** You notice your SPA's "page transitions" feel slow on mobile. Navigation Timing reveals `responseStart - fetchStart` is 400ms — DNS is re-resolved on each hard navigation because you're not preconnecting to your API origin. Fix: add `<link rel="preconnect">`.

**Fullstack:** Your server-side rendered pages look fast in staging but slow in prod. Comparing `responseStart - requestStart` across RUM data shows P95 TTFB spikes to 3s during peak hours — backend queuing, not network. Navigation Timing isolated the layer.

**SRE:** You roll out a CDN change and want to verify it improves edge cache hit rates. Tracking `connectEnd - fetchStart` in your RUM pipeline before and after shows TCP time dropped by 60% for users in Southeast Asia. Real validation, not synthetic.

### Common Pitfalls

- `secureConnectionStart` is `0` on cache hits (no TLS needed) — don't subtract it blindly
- Single-page app route changes don't create new navigation entries; those need `PerformanceObserver` watching `navigation` type entries or you track them manually
- The entry isn't available synchronously at page load — read it after `load` fires, or use a `PerformanceObserver`
