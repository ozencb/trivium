---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Layout Thrashing

Layout thrashing happens when you force the browser to synchronously recalculate layout multiple times in a single frame by interleaving reads and writes to the DOM. The browser normally batches style/layout work and defers it — but certain DOM reads (anything that requires knowing the current geometry: `offsetHeight`, `getBoundingClientRect`, `scrollTop`, etc.) invalidate that batch and force an immediate synchronous reflow so it can return an accurate value.

**The mechanism:** After any DOM write (setting a style, adding a class, mutating innerHTML), the layout is marked "dirty." The browser won't actually recompute it until it needs to — usually at the end of the frame. But if you read a geometry property while layout is dirty, the browser *must* flush and recalculate synchronously before it can return. Do that in a loop — write, read, write, read — and you're triggering a full layout recalculation on every iteration instead of once per frame.

```js
// Thrashing — triggers reflow on every iteration
elements.forEach(el => {
  el.style.width = container.offsetWidth + 'px'; // read forces reflow, then write dirties it again
});

// Fixed — batch reads first, then writes
const width = container.offsetWidth; // one reflow
elements.forEach(el => {
  el.style.width = width + 'px'; // writes only, no reads
});
```

**Practical scenarios:**

*Frontend:* The classic trap is animation loops — using `requestAnimationFrame` but reading layout inside it after a write. Also common in "match sibling heights" patterns where you iterate over elements reading height then setting it. React doesn't magically protect you here; if you're reading layout in `useLayoutEffect` after mutations, you can still thrash.

*Fullstack:* Less obvious but relevant when building server-rendered pages with hydration-time JS. Initialization code that measures DOM elements (for things like sticky headers, virtualized lists, responsive carousels) runs before the page is interactive — if it's written naively, it can block the thread and delay TTI noticeably on lower-end devices.

**Diagnosis:** Chrome DevTools Performance panel shows purple "Layout" blocks in the flame chart. Forced synchronous layouts show up explicitly labeled, with a callstack pointing directly to the offending read. If you see many narrow purple blocks in a single frame, that's thrashing.

**Fix pattern:** FastDOM library formalizes the batch-reads-then-writes approach if you're working in a codebase without a framework managing this for you. In framework land (React, Vue), the virtual DOM handles most of this, but you lose the protection the moment you reach into the DOM directly — `ref` reads inside effect hooks being the most common offender.
