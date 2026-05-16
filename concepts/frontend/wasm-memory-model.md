---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## WebAssembly Memory Model

WebAssembly gives each module instance a single, flat, byte-addressable linear memory — essentially a managed `ArrayBuffer` your Wasm code treats as its entire heap. Understanding the memory model matters once you bring in threads, because the rules governing how concurrent Wasm agents observe each other's writes are surprisingly nuanced.

### The core mechanism

Wasm memory is a contiguous address space starting at byte 0. Your module reads and writes it with typed load/store instructions (`i32.load`, `f64.store`, etc.) using integer byte offsets — no pointer indirection, no GC, no segmentation. From JavaScript, this same memory is visible as a plain `ArrayBuffer` (or `SharedArrayBuffer` if shared).

The interesting part is the **memory consistency model**, which Wasm inherits from a SC-DRF (sequentially consistent for data-race-free) guarantee — the same model C++11 and Java use. Here's what that means:

- If your program is **data-race-free** (all concurrent accesses to shared locations are mediated by atomic operations), then all threads observe a sequentially consistent order — as if operations happened in some single global sequence.
- If you have **races** (non-atomic read/write to the same location from two threads), behavior is defined (no undefined behavior like C++), but individual loads can return stale or torn values. You're in weakly ordered territory.

This is distinct from the JS memory model, which assumes single-threaded execution except where you explicitly opt into `SharedArrayBuffer` + `Atomics`. Wasm threads are real OS threads via Web Workers sharing a `SharedArrayBuffer`-backed linear memory, so weak ordering is observable.

### Concrete mental model

Think of each Wasm thread as a CPU core with its own store buffer. Without atomics, writes from thread A may not be visible to thread B immediately — the hardware is free to reorder. `atomic.store` / `atomic.load` in Wasm (or the equivalent `Atomics.store` from JS) flush those buffers and establish happens-before edges.

### Practical scenarios

**Frontend:** If you're running a Wasm image codec or physics engine off the main thread via a Worker, and you need to signal "frame is ready," use an atomic flag in shared Wasm memory rather than a plain store. Non-atomic signaling can silently fail on ARM due to weaker hardware memory ordering.

**Fullstack (Node/edge):** In Node.js with Wasm multi-threading (via worker_threads sharing a `SharedArrayBuffer`), the same rules apply. If you're building a Wasm-based data pipeline that partitions work across threads and aggregates results, ensure your partition boundaries write atomically — otherwise your aggregation thread might read partially-written state and produce corrupt output with no error signal.

The key shift in thinking: Wasm's memory model isn't about garbage collection or safety — it's about **visibility guarantees** across concurrent agents. Atomics aren't just locks; they're the mechanism that opts you into the stronger consistency tier.
