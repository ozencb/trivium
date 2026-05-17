---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Resize Observer API** fires callbacks when an element's content box changes size, enabling component-level responsive behavior without coupling to viewport-based media queries. The core problem it solves: viewport width tells you nothing useful when a sidebar collapses and your chart needs to reflow.

## How it actually works

The browser already computes layout continuously. ResizeObserver hooks into the post-layout phase — after the DOM has been reflowed but before paint — and delivers size entries for any observed elements whose dimensions changed. This means it fires for *any* cause of resize: parent flex changes, sibling insertions, font-size changes, scrollbar appearance, not just window resize.

```js
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { inlineSize, blockSize } = entry.contentBoxSize[0];
    // inlineSize = width in horizontal writing modes
  }
});
observer.observe(myElement);
```

It fires once immediately on `observe()` with current dimensions — useful for initialization. Entries are batched per frame, so if 10 elements resize in one frame you get one callback with 10 entries.

The loop guard matters: if your callback itself causes a resize (e.g., you write to a style that changes the element's size), the browser detects the cycle and defers the next notification to avoid infinite loops. You'll see entries stop arriving if you're unknowingly creating one.

## Mental model

Think of it as `MutationObserver` for layout dimensions. The browser tracks structure changes via MutationObserver; ResizeObserver tracks computed size changes. Both are async, batched, and element-scoped rather than global.

## When to reach for it

**Frontend:** Component-level breakpoints are the canonical use case. A `<DataCard>` that switches from a 2-column to 1-column layout at 380px wide should respond to its *own* width, not `@media (max-width: 768px)`. ResizeObserver makes this trivial and decouples the component from its container assumptions. Also essential for anything that needs exact pixel dimensions: canvas elements, SVG charts, virtualized lists calculating visible row count.

**Fullstack:** If you're rendering server-side components that embed a client-side widget (a chart, a table, a rich text editor), ResizeObserver is how the widget knows its allocated space without a round-trip. Particularly relevant in microfrontend architectures where a shell application controls layout and embedded widgets have no knowledge of the outer grid.

## Common pitfalls

- `contentRect` is deprecated in favor of `contentBoxSize` / `borderBoxSize` arrays (plural because of multi-column fragments), but both still work
- Observing dozens of elements is fine — ResizeObserver is designed for this and coalesces work per frame
- Don't use it as a replacement for CSS where CSS will do — if a static `width: 100%` works, use it
