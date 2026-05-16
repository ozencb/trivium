---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Intersection Observer API

The Intersection Observer API lets you react to when an element enters or exits the viewport (or any ancestor scroll container) — without polling, without scroll event listeners, without layout thrashing.

### The core mechanism

Before Intersection Observer, detecting element visibility meant attaching a `scroll` event listener, calling `getBoundingClientRect()` on each element you cared about, and comparing against `window.innerHeight`. The problem: `getBoundingClientRect()` forces a layout recalculation synchronously, and you're doing this on every scroll tick. This is expensive and was a major source of jank.

Intersection Observer moves this work off the main thread. You declare what you want to observe and a threshold (what % of the element must be visible to trigger), and the browser batches intersection checks between frames — in a way that doesn't force layout. Your callback fires asynchronously when intersection crosses your threshold.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // element is now visible
    }
  });
}, { threshold: 0.1 }); // fire when 10% is visible

observer.observe(document.querySelector('.target'));
```

The `entries` array is key: each entry has `isIntersecting`, `intersectionRatio`, `boundingClientRect`, and `rootBounds`. You're not asking "is this visible?" — you're reacting to a state transition the browser already tracked.

### Mental model

Think of it like a pub/sub system where the browser is the publisher. You subscribe elements to visibility events, and the browser notifies you when geometry crosses your declared thresholds. You never ask; you only listen.

### Practical scenarios

**Frontend:** Lazy-loading images is the canonical case — swap a `data-src` to `src` once the `<img>` is about to scroll into view. But it's equally useful for triggering animations (fade-in sections as they enter the viewport), implementing infinite scroll (observe a sentinel element at the bottom of a list), or pausing video/canvas updates for off-screen elements to save CPU.

**Fullstack:** Analytics and engagement tracking benefit here significantly. Instead of guessing whether a user "saw" an ad or a product card, you can log a server-side impression event only when the element actually entered the viewport for a meaningful duration — combine Intersection Observer with a small timer to confirm dwell time before firing the request. This is more accurate than pageview-level attribution and cheaper than scroll-event-based tracking.

### What to watch for

`rootMargin` lets you expand or shrink the intersection area — useful for preloading content slightly before it enters view. And always call `observer.unobserve(entry.target)` once you've handled a one-shot observation (like image loading) to avoid memory leaks.
