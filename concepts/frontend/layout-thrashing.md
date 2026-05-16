---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Layout Thrashing

Layout thrashing happens when JavaScript forces the browser to recalculate layout multiple times in a single frame — turning one cheap operation into dozens of expensive ones.

### The mechanism

The browser's rendering pipeline batches style and layout work. When you write to the DOM (changing styles, adding classes, modifying content), the browser marks the layout as "dirty" but defers the recalculation — it'll do it once at the end of the frame. The problem starts when you *read* layout properties (like `offsetWidth`, `getBoundingClientRect`, `scrollTop`) *after* a write. The browser can't return a stale value, so it flushes the pending layout work immediately to give you accurate numbers. Now do that in a loop — write, read, write, read — and you're forcing a full reflow on every iteration.

```js
// Thrashing: each iteration forces a reflow
elements.forEach(el => {
  el.style.width = container.offsetWidth + 'px'; // read → flush, then write → dirty
});

// Fixed: batch reads before writes
const width = container.offsetWidth; // one read, one flush
elements.forEach(el => {
  el.style.width = width + 'px'; // writes only, batched
});
```

### Why it hurts

Layout is one of the most expensive steps in the pipeline — it calculates the geometry of every affected node and its descendants. Triggering it 50 times instead of once during an animation frame blows past the 16ms budget instantly. You get jank even on fast hardware.

### Practical scenarios

**Frontend:** The classic offender is animating a list where each item's size depends on its siblings or a parent container. A drag-and-drop implementation that reads element positions and writes transforms in the same loop will thrash badly. The fix is to read all positions first (one reflow), then apply all transforms in a second pass.

**Fullstack / SSR hydration:** Less obvious, but initial hydration code that measures DOM elements to set dynamic sizes can thrash if it interleaves reads and writes across multiple components mounting in sequence. Each component mount writes to the DOM, then immediately reads for its own sizing logic. Tools like `requestAnimationFrame` or libraries like `fastdom` enforce the read/write separation at a framework level.

### How to spot it

Chrome DevTools' Performance panel shows this as interleaved purple (Layout) blocks inside a single frame rather than one consolidated block at the end. "Forced reflow" warnings in the console are the browser telling you directly that it had to flush early.

The mental model: reads are free as long as nothing is dirty. Every write poisons the well for the next read.
