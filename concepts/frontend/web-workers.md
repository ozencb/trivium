---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Web Workers

JavaScript in the browser runs on a single thread — the same thread that handles rendering, event handling, and your code. A Web Worker lets you spin up a background thread that runs JavaScript in parallel, completely isolated from the main thread.

### Core mechanism

A Worker is a separate JS execution context: no access to the DOM, no shared memory (by default), and no shared scope with your main thread code. Communication happens exclusively via message passing — you `postMessage` data in, the worker processes it, and `postMessage`s results back. The browser serializes the data via the structured clone algorithm, so what gets passed is a deep copy, not a reference.

This isolation is intentional. Because workers don't share memory, you avoid the classic concurrency hazards (race conditions, locks) at the cost of making coordination explicit.

```js
// main.js
const worker = new Worker('./worker.js');
worker.postMessage({ numbers: [1, 2, 3, ...largeArray] });
worker.onmessage = (e) => console.log(e.data.result);

// worker.js
self.onmessage = (e) => {
  const result = heavyComputation(e.data.numbers);
  self.postMessage({ result });
};
```

### Mental model

Think of it like a separate process with an IPC channel. The worker has its own event loop, its own heap, and its own global scope (`self` instead of `window`). Transferable objects (like `ArrayBuffer`) let you *transfer* ownership instead of copying — zero-copy handoff across threads.

### Where this matters in practice

**Frontend:** The main thread is your UI thread. If you run a CPU-heavy operation on it — parsing a large JSON blob, running a physics simulation, encrypting data client-side — you block rendering and the page jank or freezes. Workers let you offload that work without affecting responsiveness. This is why crypto libraries, video codecs compiled to WASM, and diff algorithms all use workers.

**Fullstack:** In a Next.js or Remix app, workers become relevant for client-side computation that would otherwise require a round-trip — think running a local ML model (Transformers.js), parsing large CSV uploads entirely in-browser before sending to an API, or building real-time collaborative features where you want local state reconciliation off the main thread.

Workers also compose well with `SharedArrayBuffer` (shared memory between worker and main thread, with `Atomics` for synchronization) and `BroadcastChannel` (pub/sub across multiple workers or tabs). `OffscreenCanvas` lets workers do GPU rendering without touching the DOM.

The main limitation: message passing overhead is non-trivial for high-frequency, small messages. For those cases, `SharedArrayBuffer` is the escape hatch — but that's a step up in complexity.
