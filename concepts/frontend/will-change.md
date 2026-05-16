---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## `will-change` CSS Property

`will-change` is a hint to the browser that an element is about to be transformed, allowing it to promote that element to its own compositor layer *before* the animation starts — eliminating the layer-creation cost that would otherwise cause jank on the first frame.

### Core Mechanism

Without `will-change`, when you trigger a CSS transform or opacity animation, the browser must:
1. Recognize the element needs its own layer
2. Rasterize and upload it to the GPU
3. *Then* start compositing

That first-frame cost shows up as a stutter. `will-change: transform` tells the browser to do steps 1–2 during idle time, so by the time the animation fires, the layer is already on the GPU and compositing can begin immediately.

Internally, this is the same promotion that `transform: translateZ(0)` (the old hack) triggers — but without the side effects of creating a bogus 3D rendering context. `will-change` is the clean API for what that hack was doing accidentally.

### Mental Model

Think of it like pre-loading a video asset vs. streaming it. Without `will-change`, the browser streams the layer to the GPU on demand. With it, you're telling the browser: "cache this ahead of time, I'll need it soon."

```css
.modal-overlay {
  will-change: opacity;   /* compositor knows this will animate */
  opacity: 0;
  transition: opacity 200ms ease;
}

.modal-overlay.visible {
  opacity: 1;
}
```

The transition fires with zero layer-promotion overhead because the browser already prepared the layer.

### Practical Scenarios

**Frontend:** Sticky nav bars, sidebars that slide in/out, carousels, parallax layers — anything with a user-triggered enter/exit animation where the first frame matters. Apply `will-change` on hover or via JS before the animation triggers, not statically on every element at paint time.

**Fullstack:** If you're rendering server-side and hydrating, heavy use of `will-change` in static CSS can cause memory bloat — the browser holds promoted layers even when they're idle. A common pattern is setting it via JS right before the animation and removing it in the `transitionend` handler:

```js
el.style.willChange = 'transform';
el.addEventListener('transitionend', () => {
  el.style.willChange = 'auto';
}, { once: true });
```

### What to Watch Out For

Layer promotion isn't free — each promoted element consumes GPU memory. Slapping `will-change: transform` on everything is a common mistake that can make performance *worse* on memory-constrained devices (mobile). Use it surgically: only on elements that actually animate, ideally applied just before the animation and removed after.

The browser already applies its own heuristics for what to promote; `will-change` is for cases where those heuristics fire too late.
