---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**WebAssembly (Wasm)** is a binary compilation target — not a language you write, but a format that languages like C, Rust, and Go compile *to*. The browser treats it as a sandboxed virtual ISA: typed, validated at load time, then JIT-compiled to native machine code.

**The core mechanism**

JavaScript is dynamic: types are resolved at runtime, the JIT must speculate and deoptimize, and the GC can pause execution unpredictably. Wasm sidesteps all of that. The binary format encodes explicit types, a structured control flow graph (no arbitrary jumps), and a stack-based execution model. Because the runtime can *prove* invariants from the binary itself, it skips the speculative phases and compiles directly to tight machine code. You get throughput that sits within ~10-20% of native — not because browsers gave Wasm special privileges, but because there's simply less uncertainty to handle.

Wasm runs in a linear memory model: a contiguous, resizable byte array (`WebAssembly.Memory`) that the module reads and writes directly. There's no GC, no object heap — just a flat address space. This is what unlocks the WebAssembly Memory Model and OffscreenCanvas integration: you can pass raw pixel buffers or typed array views across without copying.

**Mental model**

Think of it like shipping a `.o` object file to the browser instead of source code. The browser links it, verifies it can't escape its sandbox, and runs it. The sandbox is enforced structurally — Wasm can't access DOM APIs or arbitrary memory outside its linear buffer. To talk to JS, you define explicit imports/exports at the module boundary.

**Practical scenarios**

*Frontend:* CPU-bound work that makes JS stutter — image/video processing, physics engines, codecs, cryptography. Figma's canvas renderer, Squoosh's codec pipeline, and DuckDB-Wasm are canonical examples. If you have a tight loop running millions of iterations with numeric operations, Wasm will outperform optimized JS and do so *consistently* (no GC jank).

*Fullstack:* Wasm is increasingly used outside browsers via WASI (WebAssembly System Interface) — a POSIX-like syscall layer. This lets you run the same Wasm binary on the server (Cloudflare Workers, Fastly Compute) and in the browser, which is compelling for shared business logic written in Rust or C.

**When to reach for it**

Wasm is not a general JS replacement. The JS↔Wasm boundary has overhead — calling across it in a tight loop can negate the gains. It shines when you have a computational kernel (encode this frame, run this simulation, compress this buffer) that you can invoke infrequently with large payloads. If you're considering it for string manipulation, DOM work, or anything I/O-bound, the JS runtime will likely beat it on practical throughput.
