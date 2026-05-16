---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## CSS Animation Performance

CSS animation performance is about which part of the browser's rendering pipeline your animation triggers — getting this wrong means dropped frames even on powerful hardware, regardless of how "simple" the animation looks.

### The core mechanism

The browser renders frames through a pipeline: **Style → Layout → Paint → Composite**. Each stage is progressively cheaper, and compositing is the only stage that runs on the GPU compositor thread rather than the main thread. This matters because the main thread also handles JavaScript execution — if it's busy, your animation stutters.

The key insight: certain CSS properties can be animated by handing them entirely to the compositor thread, bypassing Layout and Paint. Specifically: `transform` and `opacity`. Everything else (`width`, `height`, `top`, `left`, `color`, `margin`, etc.) forces the browser back up the pipeline.

Animating `left: 0` to `left: 100px` triggers Layout (the document has to reflow) then Paint (pixels need redrawing) on every frame. Animating `transform: translateX(0)` to `transform: translateX(100px)` only requires compositing — the element's pixels were already painted, the GPU just repositions the texture.

### Concrete mental model

Think of the browser like a theater. Layout and Paint are stagehands repositioning furniture and repainting backdrops. The compositor is a projection system overlaying pre-rendered images. Animating compositor-only properties means only the projector moves; the stagehands never touch anything.

When you promote an element to its own compositing layer (via `will-change: transform` or `transform: translateZ(0)` — which you already know), the browser rasterizes it once and gives that texture to the GPU. Frame updates for `transform` and `opacity` changes cost almost nothing because the GPU is extremely good at matrix math and alpha blending.

### Practical scenarios

**Frontend:** A slide-in drawer or modal overlay should animate using `transform: translateX(-100%)` → `translateX(0)` rather than animating `left` or `margin-left`. Similarly, fade animations should use `opacity`, not `visibility` toggling or color transitions. This is the difference between a 60fps animation and one that visibly hitches on mid-range mobile hardware.

**Fullstack:** When rendering server-side and hydrating — say, a Next.js app — expensive paint-triggering animations on initial load compound hydration cost. If a hero animation fires before hydration completes, the main thread is contending with both JavaScript parsing and layout recalculation simultaneously. Using compositor-only animations means the animation runs on a separate thread and appears smooth even while the main thread is still bootstrapping.

### Connection to Web Animations API

The Web Animations API is essentially a programmatic interface to the same compositor pathway. When you use it correctly (animating `transform`/`opacity` via `element.animate()`), the browser can offload the entire animation to the compositor thread and you gain fine-grained control (playback rate, pause/resume, promises for completion) without sacrificing the performance characteristics you get with CSS keyframes.
