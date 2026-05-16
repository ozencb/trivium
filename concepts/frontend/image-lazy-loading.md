---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Image lazy loading** defers fetching images until they're near the viewport, cutting initial page load time and wasted bandwidth on images users never scroll to.

## Core Mechanism

The naive mental model is "load images when they're visible," but the real behavior is more nuanced. You set a placeholder (empty `src`, a low-res blur, or a data URI) and store the real URL in `data-src`. An `IntersectionObserver` watches each image element with a `rootMargin` buffer — typically `200px` — so the real fetch starts *before* the image enters view, not after. This hides the latency from the user.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
}, { rootMargin: '200px' });

document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
```

The `rootMargin` is the actual lever — too tight and users see images popping in; too loose and you've partially negated the benefit.

## What It Actually Buys You

Initial page weight drops substantially. A product listing with 60 images where only 8 are above the fold means the browser skips 52 HTTP requests on load. Beyond bandwidth, it affects Core Web Vitals: fewer competing requests means LCP candidates (the hero image, typically) resolve faster because the network isn't saturated.

The browser's native `loading="lazy"` attribute handles this without JS for most cases now, using a heuristic rootMargin that varies by connection speed. It's sufficient for most use cases, but gives you no control over thresholds, placeholder behavior, or the load trigger logic.

## Practical Scenarios

**Frontend:** In a photo gallery or infinite scroll feed, lazy loading is table stakes. The pattern to watch for: images inside CSS `display:none` containers still get observed by IntersectionObserver even though they're invisible — they might load before the user ever toggles that tab open. Sometimes intentional, sometimes not.

**Fullstack:** If you're generating pages server-side, above-the-fold images should get `loading="eager"` (or no attribute) and ideally a `fetchpriority="high"` hint. Blanket `loading="lazy"` on all images — a common copy-paste mistake — delays the LCP image and tanks your PageSpeed score. The server knows which images are above-the-fold at render time; the browser doesn't until layout runs.

## The Edge Cases Worth Knowing

- Images inside `<picture>` with `srcset` need `loading="lazy"` on the `<img>`, not the source elements.
- Lazy loading and `decoding="async"` are orthogonal — lazy controls *when* to fetch, async controls *when* to decode (off main thread). Use both.
- SSR hydration mismatches can occur if you render `src=""` server-side but the client hydrates with the real src — some frameworks need explicit handling here.
