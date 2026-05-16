---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Resize Observer API** lets you react to an element's size changes — not the viewport's — without polling, and it does so at the right point in the browser's rendering pipeline.

## Core Mechanism

After layout runs, the browser delivers a batch of `ResizeObserverEntry` objects to your callback. Each entry exposes the element, its new `contentRect`, and (in modern browsers) `contentBoxSize`, `borderBoxSize`, and `devicePixelContentBoxSize` as separate measurements.

The critical distinction from `window.resize`: a viewport resize is one cause among many. Flexbox redistribution, CSS transitions, dynamic content injection, font loading — all can change an element's dimensions with no viewport event firing. Resize Observer captures all of them.

Callbacks run after layout but before paint, so you can read layout properties without forcing a reflow. If your callback *writes* layout-affecting properties, the browser re-runs layout — but Resize Observer prevents infinite loops by suppressing re-notification within the same frame when the change originates from a deeper DOM descendant.

## Mental Model

Instead of `setInterval(() => checkDimensions(el), 100)`, think of it as a database trigger: register "notify me when this element's box dimensions change," and the browser handles the diffing. You get delivered results, not a polling burden.

```js
const ro = new ResizeObserver(entries => {
  for (const entry of entries) {
    const { inlineSize, blockSize } = entry.contentBoxSize[0];
    redrawChart(entry.target, inlineSize, blockSize);
  }
});
ro.observe(chartContainer);
```

## Practical Scenarios

**Frontend:**
- Canvas-based charts (D3, Chart.js) need container dimensions to recompute axes and scales. If the chart lives in a collapsible sidebar or a CSS Grid cell, window resize won't fire when the layout redistributes space — Resize Observer will.
- Virtual scroll lists need accurate container height. Browser zoom and font size changes don't trigger `window.resize` but do trigger Resize Observer, so your row measurements stay correct.
- Component-level breakpoints: apply `data-size="compact"` to a widget based on its own width, not the viewport's — this is the JS-based precursor to CSS container queries, and still useful for behavior (not just styling).

**Fullstack:**
- SSR'd dashboards with user-resizable panels: when a drag handle moves, downstream components (Monaco editor, preview panes, embedded maps) need to reflow. Resize Observer gives each component a clean, decoupled hook without prop-drilling or global event buses.
- Embedded widgets in CMS or third-party contexts where you don't control the host layout — observe your own root element and adapt internally.

**One gotcha:** the default observed box is `content-box`. If you need to track including padding/border (common for positioned elements), pass `{ box: 'border-box' }` to `observe()`. Mixing box types across entries in the same callback is valid but requires checking which type each entry reports.
