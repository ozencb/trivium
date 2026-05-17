---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Compositing Layers

After the browser paints pixels, it doesn't always flatten everything into a single image. Instead, it can maintain separate textures in GPU memory—one per "layer"—and let the GPU combine (composite) them at draw time. This matters because moving or fading a layer is a GPU matrix operation that never touches CPU-side paint code.

**The mechanism**

The browser's compositor thread is separate from the main thread. When an element has its own compositing layer, animations driven by `transform` or `opacity` can run entirely on the compositor thread—meaning a busy JavaScript event loop doesn't jank them. The GPU takes each texture, applies a transform matrix, and blends the results. No repaint, no rasterization, just a few floating-point multiplications.

Layer promotion happens explicitly or implicitly. Explicit: `will-change: transform` or `transform: translateZ(0)` tells the browser ahead of time. Implicit: certain CSS properties (`position: fixed`, `filter`, `clip-path`, some `z-index` arrangements) trigger promotion automatically, sometimes unexpectedly.

**Concrete mental model**

Think of Photoshop. You have layer A (background) and layer B (a button). Moving layer B doesn't require redrawing A—Photoshop just repositions the layer. The browser compositor works the same way: each promoted element is a separate texture the GPU slides around. Painting is expensive; compositing is cheap.

**Where this shows up in practice**

The classic use case is animating `transform` instead of `left/top`. `left: 100px → left: 200px` triggers layout → paint → composite. `transform: translateX(200px)` skips straight to composite. Same visual result, completely different cost profile.

Scroll-linked animations (`position: sticky`, parallax effects) are another hotspot. If sticky elements aren't on their own layer, every scroll tick forces repaint. Browsers often promote sticky elements automatically, but complex sticky headers with shadows or filters can fall out of GPU-land silently.

**The pitfall senior engineers catch**

Layer explosion. Animating a list of 200 items with `will-change: transform` on each row creates 200 GPU textures simultaneously. VRAM spikes, the compositor's overdraw budget gets consumed, and performance degrades worse than if you'd done nothing. The fix is to promote only the actively-animated element—often by toggling a CSS class during the animation, then removing it.

DevTools' Layers panel (Chrome) makes this visible. The "Memory" estimate per layer is real: a full-viewport element at 2x DPR can cost 4MB+ per layer.

**The interview signal**

Most engineers know "use transform, not top/left." Senior engineers explain *why*—compositor thread independence—and know when promotion backfires. Being able to reason about the tradeoff between animation smoothness and VRAM budget, and knowing how to verify layer counts in DevTools, marks someone who's debugged production jank rather than just read about it.
