---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CSS Animation Performance

The browser rendering pipeline has distinct phases: style → layout → paint → composite. Animations that touch properties like `width`, `height`, `top`, or `left` re-trigger layout (reflow) or paint on every frame, forcing the main thread to do expensive work at 60fps. `transform` and `opacity` skip directly to the composite step because the compositor thread can handle them independently, using the GPU to interpolate between layer states without involving the main thread at all.

**The core mechanism:** When you promote an element to its own compositor layer (via `will-change: transform` or `transform: translateZ(0)`), the GPU holds a texture of that element. Animating `transform` just updates a matrix applied to that texture — no layout, no repaint. The compositor thread runs separately from the main thread, so even if your JS is blocking, the animation keeps running smoothly. Animating `left: 100px` instead of `transform: translateX(100px)` forces the browser to recalculate geometry for the element *and* potentially its siblings and children, then repaint the affected area, every single frame.

**Mental model:** Think of the compositor as a photo editor with pre-rendered layers. Moving, scaling, or fading a layer is instant — just matrix math on a texture. Changing the *content* of a layer (shape, size, color outside opacity) requires regenerating the texture first.

**Common pitfall:** `box-shadow`, `border-radius` changes, `filter` (most values), and `clip-path` animations all trigger paint. `filter: blur()` and `filter: drop-shadow()` are expensive — `opacity` changes are not, even though both look "visual-only."

```css
/* Triggers layout + paint — avoid */
.bad { animation: slide 0.3s; }
@keyframes slide { to { left: 100px; } }

/* Compositor only — preferred */
.good { animation: slide 0.3s; }
@keyframes slide { to { transform: translateX(100px); } }
```

**Frontend:** Every interactive animation — drawers, modals, tooltips, drag handles — should use `transform` for position and `opacity` for visibility. The classic show/hide pattern with `display: none` toggling is jarring partly because there's no in-between state; fading with opacity + pointer-events gives you a compositor-friendly transition.

**Fullstack:** Dashboard charts that animate on data updates (D3, Chart.js) often animate SVG attributes like `cx`, `cy`, `r`, which trigger paint. Wrapping elements and animating their `transform` instead, or using SMIL/Web Animations API with compositor-eligible properties, keeps dashboards smooth even when the main thread is busy processing WebSocket updates.

The payoff is particularly visible on low-end Android devices or when the main thread is under load — compositor animations don't degrade gracefully, they just *keep working*. This is the foundation for why the Web Animations API explicitly separates worklets onto the compositor thread.
