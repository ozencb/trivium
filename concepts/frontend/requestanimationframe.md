---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## requestAnimationFrame

`requestAnimationFrame` (rAF) lets you schedule a callback to run just before the browser paints the next frame. The key insight isn't the timing — it's that the browser *tells you* when it's ready to paint, rather than you guessing with `setTimeout`.

**Why this matters mechanically**

You already know the rendering pipeline: JS → Style → Layout → Paint → Composite. rAF hooks into the start of that sequence, once per frame, synchronized to the display's refresh rate (typically 60Hz, so ~16.7ms per frame). `setTimeout(fn, 16)` seems equivalent but isn't — timers drift against the display cycle. You'll get callbacks landing mid-frame, causing the browser to render a partial state, or two callbacks firing before a single paint, wasting computation. rAF eliminates both problems by letting the browser drive the cadence.

**The loop pattern**

```js
function animate(timestamp) {
  // timestamp is a high-res DOMHighResTimeStamp
  const elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  updateState(elapsed); // physics, position, etc.
  draw();

  requestAnimationFrame(animate);
}

const id = requestAnimationFrame(animate);
// cancel with cancelAnimationFrame(id)
```

Note the recursive structure — each invocation schedules the next. The `timestamp` arg is crucial: use it to compute `elapsed` time between frames rather than assuming 16ms. On a 120Hz display or under CPU load, frame timing varies.

**When to reach for it**

- **Canvas/WebGL rendering loops**: the canonical use case. You need frame-locked updates and rAF gives you exactly that.
- **JS-driven animation where CSS can't help**: animating along a SVG path, physics simulations, particle systems, anything requiring per-frame computation.
- **Batching DOM reads/writes**: reading layout properties (getBoundingClientRect) and writing them in the same rAF callback avoids interleaved forced reflows.

**When not to reach for it**

If CSS transitions or the Web Animations API can do it, let them — the browser can optimize those off the main thread. rAF is main-thread JS, so it competes with everything else. Also avoid using it as a general throttle for non-visual work (scroll handlers, etc.) — there are better patterns for that.

**Pitfalls**

The most common bug in component-based frontends: forgetting to call `cancelAnimationFrame` on unmount. The loop keeps running, holding a reference to unmounted component state, causing memory leaks or errors. Always store the return value and cancel it in cleanup.

The second pitfall is blowing your frame budget. You have ~16ms total, and your rAF callback needs to finish well under that (10ms is a reasonable ceiling) to leave headroom for style/layout/paint. Profile with the browser's Performance panel — if your frame bar goes red, this is usually where to look.

For fullstack engineers rendering server-pushed data (WebSockets, SSE), rAF is the right place to apply incoming updates to the DOM — buffer the data on message receipt, then flush it in the next animation frame rather than forcing a repaint on every message.
