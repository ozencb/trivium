---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## WebAssembly Memory Model

WASM doesn't get native heap access — it operates on a single flat byte array, and everything your module allocates lives inside that buffer. This constraint is deliberate: it makes WASM sandboxable and portable, but it forces you to think about memory in ways that JS developers rarely have to.

**The mechanism**

When a WASM module instantiates, it declares a `Memory` object — essentially a `WebAssembly.Memory` backed by an `ArrayBuffer` (or `SharedArrayBuffer` for threaded modules). This is a contiguous region of bytes, addressable by 32-bit integer offsets (64-bit with the memory64 proposal). The module sees only integer addresses; there are no pointers in the C sense, no GC, no heap fragmentation across separate allocations — just a flat address space starting at byte 0.

Boundary enforcement happens automatically: any out-of-bounds access traps immediately, rather than corrupting adjacent memory. This is the invariant that makes WASM safe without OS-level protection rings.

**Mental model**

Think of it as a giant `Uint8Array` the size of your module's declared memory. Your C/Rust code is compiled to treat numeric offsets into that array as pointers. `malloc` inside WASM is just a bookkeeping function that hands out non-overlapping slices of this one buffer. When you grow memory (`memory.grow`), the buffer gets replaced with a larger one — which means any JS reference to the old `ArrayBuffer` is now stale.

**Where this bites you**

*Copying overhead*: Passing a string from JS into WASM means encoding it into bytes, allocating space inside the WASM linear memory, and copying it in. The reverse is the same. Libraries like `wasm-bindgen` automate this, but the copies are still happening — they're just hidden. For hot paths (image processing, audio, tight loops), this round-trip cost dominates.

*Shared memory threading*: With `SharedArrayBuffer`, the `memory` object can be shared across Web Workers. Now you're dealing with genuine shared-memory concurrency, and the Atomics API becomes necessary for synchronization — same guarantees as you'd expect from a TSO memory model. The WASM threads proposal maps directly to this.

*Memory growth invalidation*: On the frontend, if you hold a view into `memory.buffer` (e.g., a `Uint8ClampedArray` for pixel manipulation), a `memory.grow` call mid-execution silently invalidates it. You need to re-derive the view after any potential growth — a subtle bug that only manifests under load.

*Fullstack*: In WASI runtimes (Wasmtime, Wasmer), the same linear memory model applies. Your Rust-compiled-to-WASM function can't just return a `Vec<u8>` — you're passing a pointer and length, and the host runtime reads out of the module's memory at that offset.

The upshot: WASM's memory model is minimal by design. Its constraints are what make it safe and fast — but they surface the copying and lifetime concerns that managed runtimes normally hide from you.
