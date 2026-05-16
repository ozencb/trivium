---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

WebAssembly (Wasm) is a binary instruction format that runs in the browser at near-native speed — it exists because JavaScript's dynamic typing and JIT compilation ceiling make it unsuitable for computationally heavy work.

## Core Mechanism

The browser has always had one guest language: JavaScript. WebAssembly adds a second guest — a low-level, stack-based virtual machine that executes binary-encoded instructions directly, bypassing most of the overhead that slows JS down (parsing, type inference, deoptimization cycles).

Critically, Wasm doesn't replace JS — it runs alongside it. The browser exposes a JS API to load, instantiate, and call into Wasm modules. Wasm itself has no DOM access; it operates on linear memory (a typed ArrayBuffer) and communicates with the outside world through function imports/exports you wire up in JS.

Source languages compile to Wasm: C, C++, Rust are first-class. AssemblyScript (TypeScript-like syntax) and Go also target it. The toolchain (e.g., `wasm-pack` for Rust, `emcc` for C++) produces a `.wasm` binary and usually a JS glue file.

## Mental Model

Think of it like a native `.dll` or `.so` that the browser can load. You call into it from JS the same way you'd call a C library from Python via FFI — you hand it data through a shared memory region, it crunches numbers, you read results back. The boundary crossing has some cost, so you want to minimize calls and maximize the work done per call.

```js
const { instance } = await WebAssembly.instantiateStreaming(fetch('image_proc.wasm'));
const result = instance.exports.blur(imageDataPtr, width, height, radius);
```

## Practical Scenarios

**Frontend:** Image/video processing (filters, transcoding), physics simulations, games, PDF rendering, cryptography. Figma uses Wasm for its rendering engine. Squoosh uses it for codec work. The pattern is: JS handles UI and orchestration, Wasm handles the inner loop that would otherwise drop frames.

**Fullstack:** Wasm isn't browser-only. WASI (WebAssembly System Interface) extends it to server runtimes — Cloudflare Workers, Fastly Compute, and others use Wasm as a portable, sandboxed unit of compute. You can compile a Rust function once and run it at the edge, in the browser, or in Node via the WASI API. This makes Wasm interesting as a universal binary format, not just a browser trick.

## The Real Constraint

Wasm shines when the bottleneck is CPU-bound computation. It won't help with network latency, rendering pipeline costs, or poorly structured async code. And the JS↔Wasm boundary has serialization overhead — passing complex objects requires encoding them into the shared linear memory manually (or via tools like `wasm-bindgen`), which is the friction point most engineers hit first.

Understanding Wasm's linear memory model is the natural next step — that's where most of the gotchas live.
