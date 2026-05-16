---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**SharedArrayBuffer lets multiple Workers read and write the same memory region — Atomics makes that safe.**

Normal `postMessage` between Workers copies data. For large payloads (image buffers, audio frames, simulation state), copying is too expensive and the round-trip latency kills throughput. SharedArrayBuffer sidesteps this entirely: you allocate a chunk of memory once and hand every Worker a view into that same physical buffer. No copying, no serialization.

The problem that creates: two Workers can now race. Worker A reads a value, Worker B reads the same value, both increment it, both write back — you've just lost an increment. This is the classic read-modify-write race, and JavaScript's event loop model gives you zero protection here because Workers are genuinely parallel threads.

**Atomics** is the fix. It provides operations that the CPU guarantees are indivisible — `Atomics.add`, `Atomics.compareExchange`, `Atomics.load`, `Atomics.store`, etc. No other thread can observe a half-finished operation. It also gives you `Atomics.wait` and `Atomics.notify` — essentially a mutex/condition variable: one Worker blocks on a memory address until another Worker notifies it. This is the mechanism WebAssembly uses to implement its memory model, which is why understanding this unlocks Wasm threading.

**Concrete mental model:** treat SharedArrayBuffer like a shared whiteboard in a room full of people. Without Atomics, everyone reads and writes whenever they want — chaos. With Atomics, you've established a rule: to change a number, grab the marker (compare-exchange), change it, put the marker down. Everyone else waits.

**Frontend scenario:** you're writing a video editor. A decode Worker is filling a ring buffer with frames, and a render Worker is consuming them. SharedArrayBuffer holds the frame data. You use `Atomics.add` to advance the write pointer atomically and `Atomics.wait`/`Atomics.notify` to signal the render Worker when new frames are ready — all without copying frame data across the Worker boundary.

**Fullstack scenario:** Node.js has had `worker_threads` with SharedArrayBuffer since v12. If you're building a high-throughput processing pipeline — say, transforming binary data from a socket before forwarding it — you can hand off chunks to a worker pool via shared memory instead of copying buffers through message channels. At scale, this meaningfully reduces GC pressure.

One practical caveat: `SharedArrayBuffer` requires cross-origin isolation (`COOP`/`COEP` headers) in browsers post-Spectre. If those headers aren't set, the constructor throws. Plan for this in deployment.
