---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## `will-change` CSS Property

`will-change` is a hint to the browser that a specific property on an element is about to be animated. The browser uses this to promote the element to its own GPU compositor layer *before* the animation begins, eliminating the costly mid-flight reclassification that causes first-frame jank.

### The core mechanism

Without `will-change`, the render pipeline during an animation start looks like: main thread detects the property change → decides to promote the element → uploads the layer to GPU → compositor thread takes over. That first segment — promotion and upload — is expensive and happens on the critical path of the first frame.

`will-change` moves promotion to an earlier, idle moment. When the animation actually fires, the layer is already resident on the GPU. The compositor thread — which runs independently from the main thread and doesn't care if your JS is blocking — can drive the animation at full frame rate from the very first frame.

This is specifically why `transform` and `opacity` are the "cheap" animation properties: they're the only ones the compositor thread can handle without touching layout or paint. `will-change` just ensures that thread is holding the element before you need it.

### Concrete example

```css
.drawer {
  will-change: transform;
  transform: translateX(-100%);
  transition: transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer.open {
  transform: translateX(0);
}
```

Without `will-change`, the first frame of that slide-in often stutters because promotion happens inline. With it, the browser promotes during idle time (typically after paint), so the transition starts smooth.

### Practical scenarios

**Frontend:** Any UI element with a predictable trigger — modals, drawers, dropdowns, tooltips — benefits from `will-change` applied on hover or just before the interaction fires. The canonical pattern is adding it via JS a frame before the animation starts and removing it after:

```js
el.style.willChange = 'transform';
requestAnimationFrame(() => el.classList.add('open'));
el.addEventListener('transitionend', () => el.style.willChange = 'auto', { once: true });
```

**Fullstack:** If you're rendering server-side and have persistent UI chrome — sidebars, sticky headers, notification toasts — it's reasonable to declare `will-change` in static CSS, since these elements animate on nearly every page interaction.

### Pitfalls worth knowing

- **Don't spray it everywhere.** Each promoted layer consumes GPU memory. Applying `will-change: transform` to 50 list items means 50 GPU textures sitting allocated.
- **Animating the wrong properties nullifies it.** `will-change: width` doesn't help because `width` forces layout — no amount of GPU promotion saves you from a reflow.
- **Static declarations have a cost.** A `will-change` in CSS that never triggers an animation is pure waste. Prefer JS-driven application when the trigger is discrete (a click, a hover state).

Think of it less as "make my animation faster" and more as "I know what's coming — here's a heads-up so you're not caught off guard."
