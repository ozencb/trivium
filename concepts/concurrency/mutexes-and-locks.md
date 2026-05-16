---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Mutexes and Locks

A mutex (mutual exclusion lock) ensures that only one thread can execute a block of code at a time. You need one whenever multiple threads share mutable state — without it, interleaved reads and writes produce results that are neither thread's intention.

### The Core Mechanism

A mutex has two operations: **acquire** (lock) and **release** (unlock). When a thread acquires a mutex, it "owns" it until it releases it. Any other thread that tries to acquire the same mutex while it's held will **block** — the OS suspends it and parks it in a wait queue. When the owner releases, the OS picks a waiting thread, marks it runnable, and hands it the lock.

The critical insight: the acquire/release operations themselves must be atomic. CPUs expose instructions like `CMPXCHG` (compare-and-exchange) that do a conditional write in a single, uninterruptible step. The mutex is essentially a flag stored in memory, and the atomicity of toggling that flag is what makes the whole thing work. The OS-level blocking layer is just an optimization so waiting threads don't burn CPU spinning.

**Mental model:** a single-occupancy bathroom. The lock on the door is the mutex. Only one person inside at a time. If occupied, you wait in the hallway. No explicit coordination — the mechanism itself enforces the invariant.

### What Mutex, What's Not

A mutex protects a **critical section** — the block between acquire and release. The section should be as short as possible. Long critical sections mean long waits; contention tanks throughput.

Two variants worth knowing:
- **Read/Write locks (RWMutex):** multiple readers can hold simultaneously, but a writer gets exclusive access. Useful when reads dominate.
- **Recursive (reentrant) mutexes:** the same thread can acquire it multiple times without deadlocking. Not available in all languages — Go's `sync.Mutex` is non-reentrant by design.

### Practical Scenarios

**Backend:** a connection pool. When a goroutine wants a connection, it needs to atomically check availability and take one. Without a mutex, two goroutines see the same slot as available and both grab it. A mutex around the "check + take" sequence collapses that race.

**Backend / Fullstack:** in-memory rate limit counters. You're tracking request counts per user in a map. Concurrent increments to the same counter race without locking — the map itself isn't thread-safe, and even if it were, read-increment-write across three steps isn't atomic. A mutex (or `sync/atomic` for simple integers) fixes both.

**Fullstack:** shared cache invalidation. When a background job refreshes a cache while request handlers are reading it, an RWMutex lets reads proceed concurrently but gives the writer clean exclusive access during the swap.

### Where This Leads

Mutexes introduce a new class of failure: **deadlock**, when two threads each hold a lock the other needs and neither can proceed. That's the direct next concept. Understanding how lock acquisition order determines deadlock risk is what motivates Two-Phase Locking in databases — and understanding the cost of contention is what motivates lock-free data structures that replace mutexes with CAS loops entirely.
