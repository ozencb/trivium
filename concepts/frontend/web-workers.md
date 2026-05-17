---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Web Workers

JavaScript is single-threaded — the same thread that runs your code also handles layout, painting, and responding to user input. When you do expensive work (parsing a large JSON payload, running image filters, crunching numbers), you're blocking that thread. The browser can't repaint, clicks don't respond, scroll stutters. Web Workers give you a separate OS thread where JavaScript actually runs in parallel, not just asynchronously.

### The core mechanism

A Worker is a real background thread. It doesn't share memory with the main thread — each side has its own heap, global scope, and event loop. Communication happens via `postMessage`, which by default serializes data using the structured clone algorithm (deep copy, not JSON — it handles `ArrayBuffer`, `Map`, `Date`, etc.). You can also transfer ownership of `ArrayBuffer`s to avoid copying, which matters for large binary data.

```js
// main.js
const worker = new Worker('./worker.js');
worker.postMessage({ pixels: buffer }, [buffer]); // transfers ownership
worker.onmessage = (e) => renderResult(e.data);

// worker.js
self.onmessage = ({ data }) => {
  const result = heavyProcessing(data.pixels);
  self.postMessage(result);
};
```

No DOM access inside a worker — that's the constraint. Workers can use `fetch`, `WebSockets`, `IndexedDB`, `crypto`, and most Web APIs that aren't UI-bound.

### Mental model

Think of it like spawning a subprocess in Node. The main process and child don't share memory directly; they pass messages. The difference is that with workers, the spawning overhead is low enough to be practical for medium-lived tasks, not just long-running daemons.

### When to reach for this

**Frontend:** Image processing (filters, resizing, format conversion), running a WASM module (e.g., a video codec, a physics engine), parsing large files on drop/upload, anything that makes your `performance.now()` numbers embarrassing. A good heuristic: if a task takes >16ms and runs on user-initiated actions, it's a Worker candidate.

**Fullstack:** In Next.js or similar SSR setups, workers are less relevant server-side (Node has worker_threads, but different tradeoffs). The real value is client-side: offloading data transformation that would otherwise happen in `useEffect` after a fetch, keeping the initial render fast.

### Common pitfalls

- **Serialization cost**: Copying a 50MB object via structured clone is not free. Measure before assuming workers help — sometimes the copy overhead beats the parallelism gain. Use `transfer` for buffers.
- **Worker startup latency**: Creating a worker takes ~40-100ms. Pool workers and reuse them rather than spawning per-task.
- **Debugging**: Breakpoints inside workers work in DevTools, but it's easy to miss — open the worker thread in the Sources panel explicitly.

Workers unlock `OffscreenCanvas` (render to canvas off-thread), `SharedArrayBuffer` (shared memory with atomics for lock-free coordination), and the `BroadcastChannel` API (pub/sub across tabs and workers).
