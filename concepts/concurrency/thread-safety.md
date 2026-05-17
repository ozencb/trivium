---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Thread Safety

When multiple threads access shared mutable state without coordination, they can observe and act on intermediate, inconsistent states — thread safety is the set of guarantees that prevent this from producing incorrect behavior.

### The Core Mechanism

Modern CPUs and compilers don't execute code the way it reads. Instructions get reordered, values get cached in registers, and memory writes propagate to other CPU cores with delay. When you have one thread, none of this matters — your view of memory is always self-consistent. With multiple threads, each thread has its own partial, potentially stale view of memory, and without explicit synchronization, there's no guarantee when (or if) a write from one thread becomes visible to another.

The deeper issue is **atomicity**. Operations that look atomic in source code often aren't at the machine level. A simple `counter++` compiles to: load value, increment, store value — three separate steps. If two threads do this concurrently, both might load `5`, both compute `6`, and both store `6` — you've lost a write. The final value is `6` instead of `7`. This is a **race condition**: the outcome depends on arbitrary CPU scheduling.

Thread-safe code must provide:
1. **Atomicity** — operations that must happen together actually do
2. **Visibility** — writes from one thread become visible to others in a defined order
3. **Ordering** — operations happen in a predictable sequence across threads

### Mental Model

Imagine a shared whiteboard. Single-threaded code is one person writing on it — coherent, sequential. Multiple threads are multiple people writing simultaneously with no coordination: you erase what someone else half-wrote, you read a sentence mid-edit. Synchronization is the rule: "one person writes at a time, others wait and see the complete result."

### In Practice

**Backend**: A request counter or session cache shared across goroutines/threads is the classic case. An in-memory cache without a lock is a latent data race — usually fine until load spikes and two threads simultaneously write the same key.

**SRE**: Metrics aggregation daemons often maintain shared counters. Thread-unsafe implementations produce phantom spikes or dropped counts under load — bugs that only surface in production at scale, not in tests.

**Fullstack**: Node.js sidesteps most of this with its event loop, but the moment you reach for worker threads or shared `SharedArrayBuffer` for performance, the same invariants apply. WebAssembly with threads has explicit atomic operations for this reason.

The guarantees required — and the cost of providing them — are why mutexes, lock-free structures, and immutability patterns exist. Each is a different tradeoff between safety, performance, and complexity.
