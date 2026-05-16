---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Thread safety** means a piece of code produces correct results when executed concurrently by multiple threads. It matters because modern runtimes run your code in parallel by default, and without it, shared state becomes a source of non-deterministic bugs that are nearly impossible to reproduce reliably.

## The core idea

The problem isn't concurrency itself — it's *shared mutable state*. When two threads read and write the same memory location without coordination, you get a race condition: the final result depends on which thread's CPU instructions happen to interleave at that moment.

The canonical example is a counter increment. In source code it looks atomic: `count++`. But at the hardware level it's three operations: read the value, add 1, write it back. If two threads both read `count = 5` before either writes, both write `6`. You've lost an increment. This isn't a compiler bug or an OS bug — it's the correct behavior of a system that makes no guarantees about ordering across threads unless you explicitly request them.

Thread safety is achieved by ensuring that either:
1. State isn't shared (each thread gets its own copy)
2. State isn't mutable (immutable data is safe to share freely)
3. Access is coordinated (mutexes, atomics, channels)

The reason mutexes work is they enforce *happens-before* relationships: the lock acquire on thread B cannot complete until thread A releases, so all of A's writes are visible to B after that point. This is as much about memory visibility across CPUs as it is about serializing operations.

## Practical scenarios

**Backend:** A Go HTTP server handling requests concurrently. If you have a `map` that caches DB results and multiple goroutines write to it simultaneously, you'll get a panic or corrupted data. You fix it with `sync.RWMutex` or `sync.Map`. This class of bug tends to only surface under load — fine in dev, blows up in prod.

**SRE:** You're profiling a service that randomly serves stale config. The culprit: a background goroutine reloading config writes a struct while request handlers read it, and the struct update isn't atomic. The fix might be as simple as using an `atomic.Value` or restructuring the update to swap a pointer. Thread safety issues often masquerade as "flaky" behavior.

**Fullstack:** Node.js is single-threaded, so JavaScript itself is mostly safe — but if you use worker threads and share `SharedArrayBuffer`, you're back in the same territory. More commonly: React's concurrent rendering mode can call your components multiple times or in unexpected orders, which matters if your component has side effects that write to external mutable state.

The mental model that scales well: treat shared mutable state as a critical section that needs explicit ownership. Either one thread owns the data at a time (mutex), or the data structure is designed so operations can't interleave destructively (atomics, lock-free structures).
