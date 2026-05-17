---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## OffscreenCanvas

The main thread in a browser is a single-threaded bottleneck: layout, event handling, JavaScript execution, and canvas painting all compete for the same time budget. `OffscreenCanvas` breaks that monopoly by transferring rendering ownership to a Worker, so your drawing loop runs on a separate thread entirely.

### The core mechanism

A regular `<canvas>` element's rendering context is permanently bound to the main thread. `OffscreenCanvas` gives you a canvas-like object that has no DOM attachment and can be passed to a Worker via `transferControlToOffscreen()`. Once transferred, the main thread loses access to that canvas context — ownership is exclusive. Inside the Worker, you call `canvas.getContext('2d')` (or `'webgl'`) exactly as you would on the main thread, and any draw calls go directly to the compositor without touching the main thread's event loop.

```js
// Main thread
const canvas = document.getElementById('game');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('renderer.js');
worker.postMessage({ canvas: offscreen }, [offscreen]); // transfer, not copy

// renderer.js (Worker)
self.onmessage = ({ data }) => {
  const ctx = data.canvas.getContext('2d');
  // draw loop here — completely isolated from main thread jank
};
```

The key word is *transfer*, not copy — this uses the Transferable interface. After the call, `offscreen` is neutered on the main thread and the Worker owns the GPU surface.

### When it actually matters

The practical win shows up in two patterns:

**Heavy particle systems or data visualizations.** If you're rendering 10k points per frame derived from a stream of incoming data, your draw loop and your data processing are competing. Moving rendering to a Worker means a 200ms data-processing spike on the main thread no longer drops frames.

**WebGL scenes alongside interactive UI.** A WebGL game loop in a Worker means React re-renders, scroll events, and input handlers can't starve your frame budget. This is the "keep 60fps regardless of JS work" scenario in practice.

### The sharp edges

- **No DOM access in Workers** — so anything that needs layout measurements or hit-testing still has to live on the main thread and be messaged over.
- **ImageBitmap is your friend** — passing image data between threads should go through `createImageBitmap()`, which is transferable. Passing raw pixel arrays is expensive.
- **Context loss** — WebGL context loss handling is trickier since you can't listen to canvas DOM events from the Worker. You need a message channel back to the main thread.
- **Safari lagged** — `OffscreenCanvas` support was incomplete in Safari until 2023, so check your target baseline before committing to it.

For fullstack engineers: if you're doing server-side canvas rendering with Node.js (e.g., generating chart images), `OffscreenCanvas` is available natively in Node 18+ and is the preferred API over `node-canvas` for new code.
