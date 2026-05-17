---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Browser Rendering Pipeline

The browser rendering pipeline is the deterministic sequence of operations a browser must complete before any pixel appears on screen. Understanding it matters because each stage is a potential performance cliff — work done in one stage may invalidate and force re-execution of later stages.

### The Mechanism

The pipeline has five distinct stages:

**Parse** — HTML is tokenized and built into a DOM tree. CSS is parsed into a CSSOM tree. JavaScript can block both: a `<script>` tag halts HTML parsing until the script executes, because JS can mutate the DOM mid-parse. These two trees are merged into the **Render Tree**, which contains only visible nodes with their computed styles.

**Layout (Reflow)** — The browser calculates the exact geometry of every render tree node: position, size, and relationship to siblings and ancestors. This is expensive because layout is *relational* — changing one element's width can cascade and force recalculation of its parent, siblings, and all descendants. The browser works in a constraint-propagation model, not just top-down.

**Paint** — The browser records drawing instructions for each layer: fill this rectangle, draw this text, apply this border. This is not yet pixels — it's a display list, more like a vector recording than a bitmap.

**Composite** — Layers are uploaded to the GPU and combined in the correct stacking order. This is the only stage that runs entirely off the main thread.

### Mental Model

Think of layout as a spreadsheet with circular references: change one cell and Excel recomputes the entire dependency chain. Paint is like recording a macro of draw calls. Composite is playing that macro on a GPU that can do it in parallel across layers.

The key invariant: **you can only skip earlier stages, never later ones**. A CSS `transform` only triggers composite (cheap). Changing `width` triggers layout → paint → composite (expensive). Changing `color` skips layout but triggers paint → composite (medium).

### Practical Scenarios

**Frontend:** Animating `top`/`left` causes layout thrashing on every frame — 60fps means 60 full pipeline runs per second. Using `transform: translateX()` instead keeps work in the composite stage only, where the GPU handles it without touching the main thread.

**Fullstack:** Server-side rendered HTML still goes through this entire pipeline on the client. If your SSR returns deeply nested tables or floats, the layout stage is doing constraint propagation across hundreds of interdependent nodes — the HTML size is not the only rendering cost. Structural simplicity in markup directly reduces layout complexity.

The pipeline is essentially a dependency graph: mutations flow forward through stages, and the browser's job is to find the minimal re-execution path from mutation to pixels.
