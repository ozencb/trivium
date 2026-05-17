---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Largest Contentful Paint Optimization

LCP measures when the browser paints the largest element visible in the viewport — typically a hero image, above-the-fold text block, or video poster — and Google's threshold for "good" is under 2.5 seconds. Optimizing it matters because LCP is the metric most correlated with users' perception of whether a page has loaded.

### Core Mechanism

The browser can't paint what it hasn't fetched, decoded, and laid out. LCP optimization is fundamentally about removing anything that delays those three steps for your largest element. The four main contributors to a slow LCP are: slow TTFB (server takes too long to respond), render-blocking resources (scripts/stylesheets that pause the parser before it can discover the LCP element), resource load delay (the LCP resource is discovered late in the waterfall), and resource load time itself (the asset is large or on a slow CDN).

The key insight: the browser often discovers hero images late because they're in CSS (`background-image`) or in a `<img>` below the fold of the initial HTML. The preload scanner can't find what it can't see in markup.

### Mental Model

Think of the browser as a pipeline with a bottleneck audit. You want to trace the critical path from "byte 0 of the HTML response" to "LCP element painted." Every hop adds latency: DNS → TLS → TTFB → HTML parse → LCP resource discovered → LCP resource fetched → decoded → layout → paint. Optimization means collapsing as many hops as possible.

### Concrete Example

You have a hero `<img>` that's lazy-loaded by default via a library. The browser downloads 80KB of JS, executes it, then sets `src` on the image. That single decision adds ~300–600ms of JavaScript parse/execute time before the image even starts fetching. Fix: mark it `loading="eager"`, add `fetchpriority="high"`, and add a `<link rel="preload">` in `<head>` so the preload scanner finds it immediately.

### Frontend Patterns

- Use `fetchpriority="high"` on the LCP `<img>` and drop any lazy-load attribute on it.
- Avoid CSS `background-image` for LCP elements — the browser discovers those only after CSSOM is built.
- Serve images via a CDN with proper cache headers; consider AVIF/WebP with a `<picture>` fallback.

### Fullstack Patterns

- TTFB is often the silent killer. Server-side streaming (React's `renderToPipeableStream`, Next.js App Router) lets the browser start parsing HTML before the full response is ready.
- Use `<link rel="preconnect">` to the image origin in your document `<head>` if it's a third-party CDN.
- For SSR apps, avoid waterfalling data fetches that delay the initial HTML flush — the LCP element can't be in HTML that hasn't been sent yet.

### Common Pitfall

Preloading works but can backfire: if you preload an image that ends up not being the LCP element (responsive images, viewport-dependent content), you've wasted bandwidth and potentially pushed the real LCP resource further down the queue.
