---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Intersection Observer API

The browser's scroll event + `getBoundingClientRect()` pattern works, but it's a trap: every `getBoundingClientRect()` call forces a synchronous layout, and firing that on every scroll tick means you're causing layout thrashing at 60fps. Intersection Observer offloads the geometry math to the browser, which batches and delivers intersection state changes asynchronously during its own rendering cycle.

### Core Mechanism

You register an observer with a `root` (viewport by default, or any scrollable ancestor), a `rootMargin` (extends or shrinks the root like CSS margin), and one or more `thresholds` (ratios of the element's area that must be visible to trigger). The browser tracks observed elements internally and invokes your callback with a list of `IntersectionObserverEntry` objects when any threshold is crossed — not on every scroll tick, just on state transitions.

Each entry gives you `isIntersecting`, `intersectionRatio`, `boundingClientRect`, and timestamps. Critically, this callback runs outside the scroll event pipeline, so there's no layout forcing.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadImage(entry.target);
      observer.unobserve(entry.target); // stop watching once loaded
    }
  });
}, { rootMargin: '200px', threshold: 0 });

document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
```

The `rootMargin: '200px'` pre-fires 200px before the image enters the viewport — standard practice for lazy loading so users don't see a loading flash.

### Practical Scenarios

**Frontend:** Lazy loading images and iframes is the canonical use case. Beyond that: triggering CSS animations when sections scroll into view, infinite scroll (observe a sentinel element at the list bottom), and detecting when a sticky header becomes active. For analytics, you can track "was this content actually seen?" rather than just "was this page visited?"

**Fullstack:** If you're rendering above-the-fold content server-side and deferring below-the-fold hydration, Intersection Observer is what triggers that hydration. Frameworks like Next.js use it internally for `next/image` lazy loading. You can also use it to implement accurate content engagement metrics — only count a read if the element was visible for >X seconds.

### Common Pitfalls

- **Forgetting to unobserve:** If you're observing hundreds of elements for a one-shot trigger (lazy load, analytics ping), call `observer.unobserve(entry.target)` after firing or you leak observers.
- **Initial callback:** The observer fires once immediately on `observe()` to report current state. Always check `isIntersecting` rather than assuming a callback means "just entered viewport."
- **`rootMargin` units:** Must be in `px` or `%` — no other CSS units work, and `%` is relative to the root, not the element.

Reach for this whenever you'd otherwise put logic inside a scroll event handler that touches element geometry.
