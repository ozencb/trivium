---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Compositing Layers

The browser doesn't draw your entire page as a single flat image — it splits portions of the page into independent surfaces called compositing layers, then hands them to the GPU to assemble. This separation means certain visual changes (transforms, opacity) can happen entirely on the GPU without touching the CPU-side paint pipeline.

### The core mechanism

After layout and paint, the browser has a set of painted bitmaps. Compositing is the step where those bitmaps are combined into what you see on screen. A *compositing layer* is a bitmap that the browser promotes to its own GPU texture, so it can be moved, scaled, or faded independently from everything else.

The key insight: once a layer is uploaded to the GPU as a texture, transforming it is essentially free — the GPU does matrix math on pixels it already has. No re-layout, no re-paint, no re-rasterization.

### What triggers layer promotion

Certain properties force an element into its own layer:
- `transform` with 3D functions (`translateZ`, `translate3d`)
- `will-change: transform` or `will-change: opacity`
- `position: fixed` (so the browser doesn't repaint on scroll)
- `<video>`, `<canvas>`, `<iframe>` — they always get their own layer
- Elements with CSS filters, or that are stacking-context ancestors of promoted layers

The "GPU hack" `transform: translateZ(0)` works because it forces layer promotion even though the transform itself does nothing visual — you're paying a memory cost to buy compositing.

### Concrete mental model

Think of a Photoshop document. Layers at the bottom (painted by the CPU) get flattened into a single image. But some layers can stay "live" — the GPU keeps them as separate textures and assembles the final frame on every tick without touching the others. Scrolling a page with a `position: fixed` navbar is this: the navbar texture stays put while the content texture scrolls beneath it.

### Practical implications

**Animation:** Animating `transform` and `opacity` stays on the compositor thread. Animating `width`, `top`, `background-color` forces a re-layout or re-paint, which blocks the main thread. This is why every perf guide tells you to animate transforms instead.

**Scroll performance:** Promoting scroll containers and sticky/fixed elements avoids repainting the whole page during scroll — critical on mobile.

**Layer explosion:** Over-using `will-change` creates many GPU textures, eating memory. On low-end devices this causes jank or crashes. Promote selectively and remove `will-change` after animations complete.

**DevTools:** Chrome's Layers panel shows you exactly what's been promoted and why — worth opening once to build intuition for what your CSS is actually costing.
