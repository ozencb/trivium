---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Core Web Vitals

Google's three field metrics — LCP, CLS, and INP — measure what users actually experience in production, not what your DevTools waterfall shows in a controlled lab. They matter because Google uses them as ranking signals, but more practically, they give you a shared vocabulary for diagnosing real-user degradation that synthetic benchmarks miss.

**The core distinction: field vs. lab**

You likely know the Performance Observer API well enough to collect `paint`, `layout-shift`, and `event` entries yourself — Core Web Vitals are exactly that, standardized and aggregated. Google collects these from Chrome users via the Chrome User Experience Report (CrUX), giving you p75 distributions across your actual traffic segments (mobile vs. desktop, fast vs. slow networks). The threshold targets (LCP < 2.5s, CLS < 0.1, INP < 200ms) are calibrated against those real-world distributions, not ideal conditions.

**What each metric actually measures**

- **LCP** timestamps when the largest above-the-fold image or text block finishes rendering. It's a proxy for "does the page feel loaded." The pitfall: LCP candidates change during load, so a small image that renders early can be displaced by a hero image — your LCP is the final winner, often a late-loading `<img>`.
- **CLS** accumulates layout shift scores throughout the page lifecycle, not just initial load. The non-obvious part: shifts caused by user interaction within 500ms are excluded. Everything else counts, including shifts triggered by late-injecting ads or fonts swapping.
- **INP** replaced FID in 2024. It's the worst-case interaction latency (at p98) across the full session — click, keypress, tap — measuring from input to next paint. FID only captured the first interaction and ignored processing/render time; INP catches long tasks blocking the main thread mid-session.

**Mental model**

Think of CrUX as a distributed `PerformanceObserver` running across millions of real sessions, aggregating what you'd collect yourself if you had full RUM coverage. Your lab tools (Lighthouse, WebPageTest) simulate one path; CrUX shows the distribution.

**Where this matters by role**

- **Frontend**: INP degrades with heavy React re-renders or synchronous event handlers. LCP breaks when you don't preload hero images or use lazy-loading on above-the-fold content. You need to own both.
- **Fullstack**: Slow TTFB (server response) directly delays LCP — a fast CDN or streaming SSR response has measurable field impact. CLS often comes from server-rendered height mismatches when hydration swaps content.
- **SRE**: CrUX data lags 28 days. For incident detection, you need your own RUM pipeline using `PerformanceObserver` reporting to your observability stack. CrUX confirms trends; your RUM catches regressions before they compound.

**In design discussions**: the senior move is knowing when a business decision (adding an ad slot, switching font providers, lazy-loading below the fold vs. at viewport) will shift a metric — before shipping, not after.
