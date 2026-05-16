---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Core Web Vitals

Core Web Vitals are Google's three standardized metrics for measuring real-user experience quality — not synthetic benchmarks, but field data signals that directly influence search ranking and reflect whether your page actually feels fast to users.

### The core idea

The key insight is that "performance" is too vague to optimize. CWV collapses the problem into three orthogonal axes that cover distinct failure modes: *did it load?* (LCP), *did it stay stable?* (CLS), *did it respond?* (INP).

Each metric is captured via `PerformanceObserver` in real browsers, aggregated in the Chrome UX Report (CrUX), and surfaced in Search Console and PageSpeed Insights. You're not measuring your CI environment — you're measuring the 75th percentile of your actual users' experiences.

**LCP (Largest Contentful Paint)** — time until the largest above-the-fold element (hero image, `<h1>`, video poster) finishes rendering. Good: < 2.5s. This catches slow servers, render-blocking resources, and unoptimized images.

**CLS (Cumulative Layout Shift)** — sum of unexpected layout shifts weighted by their impact fraction × distance fraction. Good: < 0.1. Classic culprit: image without `width`/`height` that loads and pushes content down, or a cookie banner that injects above existing content.

**INP (Interaction to Next Paint)** — the worst-case interaction latency across the page session, measuring from input event to next frame paint. Good: < 200ms. Replaced FID in March 2024 because FID only measured the *first* interaction, missing slow handlers triggered later.

### Mental model

Think of a page as a theater performance. LCP is: when did the curtain actually rise? CLS is: did the set pieces move around while actors were performing? INP is: when an actor was cued, how long before something visibly happened?

### Practical implications

**Frontend:** CLS failures are almost always preventable with CSS — reserve space for async content (`min-height`, explicit image dimensions, skeleton screens). INP failures usually trace to long tasks on the main thread; use `scheduler.yield()` or break work across frames with `requestIdleCallback`.

**Fullstack:** LCP is heavily server-side. TTFB directly eats into LCP budget. If you're SSRing and your DB query takes 400ms, that 400ms comes out of your 2.5s LCP budget before a single byte reaches the client. Edge rendering and aggressive caching move the needle more than frontend tuning here.

**SRE:** CWV degrade under load in ways synthetic tests miss — a p99 TTFB spike at peak traffic shows up as LCP regression in CrUX the following week. Instrument your RUM pipeline to correlate CWV percentiles with server-side metrics (TTFB, CPU saturation) so you can root-cause field regressions without guessing.

The payoff for understanding these deeply is that each metric has a specific, traceable cause — unlike "the page feels slow," which isn't actionable.
