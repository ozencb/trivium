---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Canvas 2D API

An immediate-mode 2D drawing surface where you issue imperative draw commands each frame, requiring explicit dirty tracking since the browser retains no scene graph.

Unlike the DOM—where you declare structure and the browser handles rendering, hit-testing, and updates—Canvas 2D is a pixel buffer. You draw to it, and that's it. The browser has no memory of what you drew: no elements, no event listeners, no layout engine. You own the pixels.

**Core mechanism:** You get a `CanvasRenderingContext2D` from a `<canvas>` element, then call methods like `fillRect`, `drawImage`, `arc`, `stroke`. Each call mutates the pixel buffer immediately. State (fill color, transform, clip region) is managed through a stack you push/pop explicitly with `save()`/`restore()`. There's no diffing, no retained object model. If you want to animate something, you clear the canvas and redraw everything from scratch each frame—typically inside a `requestAnimationFrame` loop.

```js
const ctx = canvas.getContext('2d');

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'red';
  ctx.fillRect(x, y, 50, 50);
  requestAnimationFrame(render);
}
```

**Mental model:** Think of it like a whiteboard with no undo. When you want to change something, you erase the whole board and redraw it. The "scene" lives in your application state, not in the canvas.

This is where the friction shows up. Hit detection? You have to implement it yourself—often by maintaining a list of shapes with their bounding boxes and running manual intersection tests on mouse events. Layering? Either manage draw order carefully or use multiple stacked `<canvas>` elements. Accessibility? Canvas content is invisible to screen readers unless you add fallback DOM content manually.

**When to reach for it:**

- *Frontend:* Custom data visualizations (charting libraries like Chart.js use it under the hood), image editing tools, sprite-based 2D games, generative art. Anything where the DOM's overhead—style recalculation, layout, compositing—becomes a bottleneck or where you need per-pixel control.
- *Fullstack:* Server-side image generation with Node.js (via `node-canvas` or similar), generating thumbnails, watermarking, producing chart PNGs for email reports.

**Where it breaks down:** Complex interactive UIs with many independent elements are painful to manage—you'll end up reinventing a scene graph. At that point, either SVG (retained-mode, DOM-integrated) or WebGL (GPU-accelerated, for 3D or high-throughput 2D) is the better fit. Canvas 2D sits in the middle: more control than SVG, far lower complexity than WebGL. Understanding it well also makes OffscreenCanvas intuitive—it's the same API, but running off the main thread in a Worker.
