---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Browser Rendering Pipeline

The browser rendering pipeline is the sequence of steps a browser takes to turn HTML, CSS, and JavaScript into pixels on screen. Understanding it explains why some code is fast and some code is invisible-tax slow.

### The Mechanism

After the browser receives bytes over the network, it runs through five distinct phases:

1. **Parse** — HTML is tokenized into a DOM tree; CSS is parsed into a CSSOM tree. These are independent and can be blocked by `<script>` tags (which halt HTML parsing) or `@import` chains (which stall CSSOM construction).

2. **Style (Recalc)** — The browser combines DOM + CSSOM into a Render Tree: only visible elements, each with their final computed styles. This is where `display: none` elements drop out entirely, but `visibility: hidden` elements stay.

3. **Layout (Reflow)** — The browser walks the Render Tree and computes the *geometry* of every element — its position, size, relationship to its parent. This is expensive because it's a dependency graph: changing one element's width can cascade and force siblings, parents, and children to recalculate.

4. **Paint** — The browser rasterizes each element into pixel layers: fills, borders, text, shadows. It doesn't necessarily paint the whole page at once — it can split into separate paint layers.

5. **Composite** — Painted layers are uploaded to the GPU and composited (flattened) into the final frame. This step runs off the main thread, which is why GPU-composited animations (`transform`, `opacity`) don't jank even when the main thread is busy.

### Mental Model

Think of it like a newspaper layout team. First they gather all the text and photos (parse). Then a designer marks what's visible and styled (style). Then a layout editor positions everything on the page (layout). Then the printer renders it (paint). Then the printing press stacks and binds pages (composite). Changing a headline on page 1 potentially forces the layout editor to redo everything that follows.

### Practical Implications

**Frontend:** This is the root cause of layout thrashing. Reading a layout property (`offsetWidth`, `getBoundingClientRect`) forces the browser to flush pending layout work synchronously. If you then *write* a style and *read* again in a loop, you're triggering a full layout on every iteration. Batching reads before writes eliminates this.

**Fullstack:** Server-rendered HTML still hits this full pipeline on the client. A page that ships 400KB of CSS forces a massive CSSOM build and style recalc before anything paints. SSR gives you fast TTFB but doesn't skip the pipeline — it just shifts parse work earlier. That's why CSS-in-JS with deferred injection can sometimes *hurt* SSR performance despite looking clean in code.

The compositing step is the escape hatch: promoting elements to their own composited layer (`will-change: transform`, `transform: translateZ(0)`) lets the GPU handle them without touching layout or paint. It costs memory, but it buys you main-thread independence.
