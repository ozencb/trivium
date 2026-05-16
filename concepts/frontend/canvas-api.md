---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Canvas 2D API

The Canvas 2D API gives you a pixel-level drawing surface in the browser via an immediate-mode rendering model — you issue draw commands, pixels change, and there's no retained scene graph or DOM to manage.

### Core Mechanism

Unlike SVG or HTML elements (which create persistent objects the browser tracks and re-renders), Canvas is a dumb bitmap. You get a `CanvasRenderingContext2D` from a `<canvas>` element and call methods on it that directly manipulate pixels. Once drawn, the canvas has no memory of what created those pixels — there are no "rectangles" or "paths" to query back. To move something, you clear and redraw.

This is the essential trade-off: DOM/SVG composites retained objects and handles hit-testing, reflow, accessibility. Canvas is a framebuffer — fast for dense, frequently-updated visuals; awkward for interactive UI elements.

The rendering model uses a **state machine**. Properties like `fillStyle`, `strokeStyle`, `lineWidth`, and transform matrices are part of a persistent context state. You set them, draw, set them again. `save()` and `restore()` push/pop that state onto a stack — critical when you're composing complex scenes where sub-routines shouldn't pollute each other's transform or style state.

```js
const ctx = canvas.getContext('2d');

ctx.save();
ctx.translate(100, 100);  // move origin
ctx.rotate(Math.PI / 4);  // rotate 45°
ctx.fillStyle = 'steelblue';
ctx.fillRect(-25, -25, 50, 50);  // draws centered square, rotated
ctx.restore();  // undo translate + rotate without explicitly reversing
```

### Mental Model

Think of it like a physical whiteboard with a marker: you draw, it stays until you erase. There's no "undo layer" — just pixels. The API is the marker; the state machine is which color/size tip is currently loaded.

### Practical Scenarios

**Frontend:** Data visualization libraries (Chart.js, D3 canvas renderers) use Canvas when rendering thousands of data points where SVG would choke on DOM node counts. Games and interactive simulations — particle systems, physics playgrounds — use Canvas for its raw throughput. Image manipulation UIs (crop, filter, annotate) manipulate pixel data directly via `getImageData`/`putImageData`.

**Fullstack:** Server-side rendering with `node-canvas` (a Node.js native binding) lets you generate charts, thumbnails, or dynamic OG images at request time without a browser. You write the same Canvas 2D API code; the output is a PNG buffer you stream to the client or store in S3.

### Why It Matters

Canvas 2D is the stepping stone to WebGL — WebGL uses the same `<canvas>` element but replaces the 2D context with a GPU pipeline. Understanding that Canvas is a dumb bitmap, that state is imperative, and that drawing is one-way makes the WebGL mental model much less alien. `OffscreenCanvas` extends this further by letting you move the canvas off the main thread entirely.
