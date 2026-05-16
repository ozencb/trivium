---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**LCP measures when the largest visible element in the viewport finishes painting** — typically a hero image or heading. Google uses it as a proxy for "did the page feel loaded?" and weights it heavily in ranking.

## The Core Mechanism

LCP isn't one thing to optimize — it's four sequential sub-parts:

1. **TTFB** — server response latency
2. **Resource load delay** — gap between TTFB and when the browser *starts* fetching the LCP resource
3. **Resource load time** — actual transfer duration
4. **Element render delay** — gap between resource received and pixel painted

Most engineers instinctively attack #3 (compress the image, use WebP). But #2 is usually the silent killer. If your LCP image lives in a CSS background, behind a JS carousel, or has `loading="lazy"`, the browser can't discover it until late in the parsing/execution pipeline — burning 200–600ms before the fetch even starts.

## Mental Model

Think of it as a relay race. Compressing the image trains runner #3. But if runner #2 is standing at the wrong handoff point because the image URL only exists after JavaScript runs, you've wasted your effort on the wrong bottleneck. Use `PerformanceObserver` with `LargestContentfulPaint` entries and inspect the `loadStart` and `renderTime` timestamps — the gaps tell you exactly which leg is losing.

## In Practice

**Frontend:** The most impactful single change is usually adding `fetchpriority="high"` to the LCP `<img>` tag. This moves it to the front of the browser's resource queue, ahead of render-blocking stylesheets and other images. Never put `loading="lazy"` on an above-the-fold image. If the LCP element is a CSS background image, switch it to an `<img>` or use `<link rel="preload" as="image">` in `<head>` so the browser discovers it in the preload scanner pass.

**Fullstack:** TTFB directly sets the floor for LCP. An SSR'd page with a 600ms server response cannot achieve a 2.5s LCP target if the hero image takes another 800ms to load — the math doesn't work. Edge caching or moving rendering to CDN edge nodes (Cloudflare Workers, Vercel Edge) collapses TTFB to 50–100ms, which can make the difference between "Good" and "Needs Improvement" even with unoptimized assets. Also: if you're doing SSR but your LCP image URL is injected client-side (e.g., pulled from a CMS API after hydration), you've negated the SSR benefit entirely — the browser sees no image in the initial HTML.

## The Non-Obvious Part

LCP measurement stops at the first user interaction. So if your page shows a skeleton for 1.5s and then loads content, but the user scrolls before the content appears, Chrome records LCP from before the scroll — meaning your metrics can look better than the actual experience if users are impatient. Always cross-check field data (CrUX) against lab data (Lighthouse) to catch this.
