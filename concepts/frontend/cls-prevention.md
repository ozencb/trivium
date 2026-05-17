---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Cumulative Layout Shift Prevention

CLS measures how much visible content jumps around during page load — and the browser charges you for every unexpected position change of an element. The root cause is almost always the same: the browser paints a layout pass, then something async (an image, font, ad, dynamic component) arrives and forces a reflow that displaces already-rendered content.

**The core mechanism**

The browser's layout engine works in passes. When it encounters an `<img>` with no `width`/`height` or an element whose size depends on content that hasn't loaded, it assigns a provisional zero-height (or content-size) slot. When the real content arrives, the browser recomputes the layout — everything downstream shifts. The CLS score accumulates the sum of these unexpected shifts, weighted by the fraction of the viewport affected and the distance elements moved.

The fix isn't to load things faster; it's to tell the browser the final dimensions *before* the content arrives, so it can reserve space and avoid reflow entirely.

**Concrete example**

A product card grid where each card has a thumbnail. If you render the cards immediately (good for LCP/FID) but the images have no dimensions:

```html
<!-- bad: browser doesn't know height until image loads -->
<img src="/product.jpg" />

<!-- good: browser reserves 300x200 before the request even completes -->
<img src="/product.jpg" width="300" height="200" style="width:100%;height:auto" />
```

The `width`/`height` HTML attributes give the browser the *aspect ratio* it needs. Combined with `height:auto` in CSS, the space scales correctly at any viewport width without hardcoding pixels. The `aspect-ratio` CSS property does the same job for non-image elements:

```css
.skeleton { aspect-ratio: 16/9; width: 100%; }
```

**Where this bites you in practice**

*Frontend:* Dynamic ad slots, cookie banners, and lazy-loaded components injected above the fold are the biggest offenders. A consent banner that pushes the hero down 80px on load is a CLS disaster — it should either render server-side at the right size, or use `position: fixed` so it doesn't participate in document flow.

*Fullstack:* SSR helps, but only if the server-rendered HTML already has correct dimensions. If your React component renders a `<Suspense>` fallback with `height: 0` and then hydrates to a real component with `height: 400px`, you get a shift even though you SSR'd. The skeleton/placeholder needs to match the final element's dimensions. If those are data-dependent (a variable-height text block), the only real option is to either clamp the height or accept the trade-off.

**When to reach for this**

Any time you have async content in the top ~2 viewport-heights. Below the fold, CLS doesn't count (shifts only score if the element was in the viewport when it started). The highest-ROI changes are: images without dimensions, font swaps (use `font-display: optional` or `swap` with `size-adjust`), and dynamically injected banners/toasts anchored to the top of the page.
