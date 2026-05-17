---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Mutexes and Locks

A mutex (mutual exclusion lock) is a token — only one thread holds it at a time, and holding it is the prerequisite for touching shared state. The guarantee isn't magic: it's a hardware-backed compare-and-swap that makes "check if free, then claim it" atomic, so two threads can't both win the race.

**The core mechanism**

A mutex is essentially a boolean in memory with atomic semantics. `lock()` spins or parks the calling thread until it can atomically flip the state from "free" to "held." `unlock()` flips it back and wakes a waiting thread. Everything between those two calls is a *critical section* — serialized, which is exactly the point.

Two properties matter beyond the basic acquire/release:

- **Re-entrancy**: a re-entrant mutex lets the *same* thread acquire it multiple times without deadlocking itself. A non-re-entrant one will deadlock if you call a locked function from another locked function in the same thread. Most language-level mutexes are re-entrant; POSIX `pthread_mutex_t` defaults to non-re-entrant.
- **Granularity**: a coarse lock protects a large structure simply but creates a bottleneck. A fine-grained lock (e.g., per-row instead of per-table) increases throughput but multiplies the surface area for bugs — specifically deadlocks, because now acquisition *order* matters.

**The deadlock invariant**

Deadlock happens when thread A holds lock 1 and waits for lock 2, while thread B holds lock 2 and waits for lock 1. The fix is enforcing a *total ordering* on lock acquisition: always acquire lock 1 before lock 2, everywhere. Violating this — even once, in one code path — is enough.

**Concrete mental model**

Think of a single-stall bathroom. The lock on the door *is* the mutex. Anyone can try the handle, but only one person gets in. The critical section is whatever happens inside. Granularity is analogous to whether you lock the whole building vs. just the stall — finer granularity means more throughput but you now have to reason about the ordering of multiple doors.

**Where this surfaces in practice**

*Backend*: connection pool management, cache invalidation (read-modify-write on a shared map), in-process job queues. Any time you're protecting a shared data structure across goroutines, threads, or async workers — even if just a counter — you need a mutex or a lock-free alternative.

*Fullstack*: less common client-side, but Node.js's single-threaded model hides this until you hit shared state across worker threads (`SharedArrayBuffer` + `Atomics`), or in WebAssembly modules with threading. Server-side, anywhere request handlers share mutable state (caches, rate limit counters in memory) brings mutex semantics back in.

Understanding this is the foundation for recognizing deadlocks when two locks interact, and for appreciating why lock-free data structures (which replace locks with atomic CAS loops) exist — they trade implementation complexity for eliminating contention entirely.
