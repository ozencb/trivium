---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Responsive Images

The browser fetches images before layout is complete — meaning it can't know the rendered size of an `<img>` when it starts downloading. Without hints, it defaults to the full-resolution source, making a 400px mobile slot download a 2400px image. Responsive images give the browser enough information to make a smart fetch decision upfront.

### The Core Mechanism

`srcset` declares a menu of image variants with their intrinsic widths (or pixel densities). `sizes` tells the browser how wide the image will render at various viewport breakpoints — *before* CSS is parsed. The browser computes: given the viewport width, the matching `sizes` rule, and the device pixel ratio, which `srcset` candidate is the smallest one that still looks good?

```html
<img
  src="hero-800.jpg"
  srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px"
  alt="Hero"
/>
```

On a 375px Retina phone (2x DPR), the browser targets ~750 CSS pixels of image data and picks `hero-800.jpg`. On a 1400px desktop monitor, it picks `hero-1600.jpg`. The `src` is just a fallback.

`<picture>` is the escape hatch when the browser's automatic selection isn't enough — art direction (different crops per breakpoint), format negotiation (WebP with JPEG fallback), or portrait vs. landscape variants:

```html
<picture>
  <source media="(max-width: 600px)" srcset="hero-crop-mobile.webp" type="image/webp">
  <source srcset="hero-wide.webp" type="image/webp">
  <img src="hero-wide.jpg" alt="Hero">
</picture>
```

### Common Pitfalls

**Wrong `sizes` values** are the most common failure. If `sizes` says `100vw` but the image renders at `50vw` due to a two-column layout, you're downloading twice the needed data. Measure actual rendered widths in DevTools and set `sizes` accurately.

**Forgetting DPR** — a 400w candidate on a 2x display looks blurry. Either include 2x variants or let the browser math handle it by providing enough width steps.

**Generating too few variants** — jumping from 400w to 1600w leaves the browser with bad options. 3–5 variants across the range you care about is typical.

### Practical Scenarios

**Frontend:** Any hero image, product card grid, or avatar that renders at different sizes across breakpoints. This is especially impactful on mobile-heavy traffic where you're shaving 200–800KB per page load.

**Fullstack:** Image CDNs (Cloudinary, Imgix, Next.js Image) generate the srcset variants server-side and inject the correct markup automatically. Understanding the underlying mechanism lets you debug when the CDN's default behavior doesn't match your layout — which happens often when you use CSS Grid or flex with dynamic column counts that the CDN can't infer.

This is the prerequisite mental model for lazy loading: once you understand that the browser makes fetch decisions early based on `sizes`, you can see why `loading="lazy"` defers that decision for below-fold images without guessing.
