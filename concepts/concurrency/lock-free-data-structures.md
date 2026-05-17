---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Lock-Free Data Structures

Most concurrent code serializes access to shared state with a lock — one thread enters, others wait. Lock-free structures eliminate that serialization entirely. Instead of mutual exclusion, they rely on atomic hardware instructions to make progress without any thread ever blocking another.

**The core mechanism: Compare-And-Swap (CAS)**

CAS is a single CPU instruction: *compare the value at a memory address to an expected value; if they match, atomically write a new value and return success; otherwise, return failure.* This is the entire foundation.

A lock-free operation works like an optimistic transaction:
1. Read the current state.
2. Compute a new desired state.
3. CAS the old state to the new state.
4. If CAS fails (someone else changed it), retry from step 1.

The invariant is subtle but powerful: if a CAS fails, it means another thread succeeded — the system as a whole made progress. This is the formal definition of *lock-free*: at least one thread always makes progress, even if individual threads retry.

**Mental model: ticket dispenser**

Imagine a lock-free counter. You read value `42`, compute `43`, then CAS `42 → 43`. If another thread did the same simultaneously and won, you'll see `43` instead of `42` and retry with `43 → 44`. Neither thread blocks; the slower one just loops once.

Scale this up to a linked list. Pushing a node means reading the current head, pointing your new node at it, then CAS-ing the head pointer to your new node. A concurrent push by another thread will cause one of them to retry. No waiting — just a brief re-do.

**Why this matters for backend engineers**

Lock-free structures pay off specifically when lock contention would otherwise be your bottleneck. In high-throughput systems — a metrics aggregator ingesting thousands of events per second, a work-stealing task scheduler, or a concurrent request counter — a mutex around every update becomes a serialization point that caps your throughput at one core's worth of work.

The JVM's `ConcurrentLinkedQueue`, Go's `sync/atomic` package, and lock-free ring buffers in LMAX Disruptor all exploit this. When you see benchmarks showing near-linear throughput scaling on multi-core hardware, lock-free internals are usually why.

**The tradeoff to articulate in interviews**

Lock-free is not always better. CAS loops waste CPU under very high contention (many threads retrying the same address). They also don't compose — two CAS operations on separate addresses can't be made atomic together without additional tricks (like double-CAS or hazard pointers). And the ABA problem — where a value changes from A to B back to A, fooling a CAS into thinking nothing changed — requires careful design (typically versioned pointers).

Knowing when contention patterns justify this complexity, and when a well-tuned mutex is simply cleaner, is what separates engineers who understand concurrency primitively from those who only know the APIs.
