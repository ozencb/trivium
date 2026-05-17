---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**SharedArrayBuffer lets multiple Web Workers read and write the same memory region directly — no message passing, no copying.** The tradeoff is that shared mutable state across threads reintroduces data races, which is exactly what the postMessage model was designed to avoid.

## The core mechanism

Normally, `postMessage` serializes data (structured clone) and transfers ownership — one thread has it, then another does. `SharedArrayBuffer` breaks this model: all workers hold a reference to the *same underlying memory*. Reads and writes are not serialized; they happen concurrently at the hardware level.

This creates a classic race condition problem. If two workers both do `buffer[0] += 1`, they each read the value, increment it locally, then write back — and you may end up with one increment instead of two. This is not hypothetical; it happens.

`Atomics` solves this with CPU-level atomic operations — instructions the processor guarantees complete without interruption:

- `Atomics.add(view, index, value)` — fetch-and-add, no torn reads/writes
- `Atomics.compareExchange(view, index, expected, replacement)` — CAS (compare-and-swap), the foundation of lock-free algorithms
- `Atomics.wait` / `Atomics.notify` — a futex-style blocking primitive for building mutexes

The key invariant: Atomics operations on a given index are *sequentially consistent* relative to each other. Non-atomic reads/writes make no such guarantee.

## Mental model

Think of it like a shared whiteboard with no locking. Without Atomics, two people can read "5", both write "6", and the net result is wrong. `Atomics.add` is like handing one person a marker that the other physically cannot grab until the first is done writing.

## Where this actually matters

**Frontend:** WASM-heavy workloads — physics engines, video codecs (FFmpeg.wasm), image processing pipelines. You offload computation to workers, but they need shared working memory without serialization overhead. SAB is also how Emscripten implements pthreads in the browser.

**Fullstack (Node.js):** Worker threads in Node share memory the same way. SharedArrayBuffer plus Atomics lets you build actual shared state between Node workers — useful for caches, ring buffers, or coordination structures where copying is the bottleneck.

## Common pitfalls

- `SharedArrayBuffer` requires cross-origin isolation (`COOP`/`COEP` headers) — this was removed after Spectre and re-added with stricter requirements. Your server config needs `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`.
- Mixing atomic and non-atomic accesses to the same index is undefined behavior by the memory model — always use Atomics consistently for a given location.
- `Atomics.wait` blocks the calling thread; it's illegal on the main thread, only usable in workers.

The direct payoff for understanding this: the WebAssembly linear memory model maps almost 1:1 onto SAB semantics, so this is the conceptual foundation you'll need when reasoning about WASM threading.
