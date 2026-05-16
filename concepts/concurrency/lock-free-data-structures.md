---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Lock-free data structures allow concurrent access without mutexes — threads make progress even if other threads are slow, paused, or crashed, eliminating contention-induced bottlenecks.

## The Core Mechanism

The key primitive is **Compare-And-Swap (CAS)**, a CPU instruction that atomically does: "set this memory location to new value *only if* it currently holds expected value, and tell me whether it succeeded."

This lets you implement optimistic concurrency: read a value, compute a new state, then attempt to atomically swap it in. If another thread modified it between your read and your swap, CAS fails and you retry. No thread ever blocks — they either succeed or loop.

A lock-free linked list push looks roughly like:

```go
func (s *Stack) Push(val int) {
    new := &Node{val: val}
    for {
        top := atomic.LoadPointer(&s.head)
        new.next = (*Node)(top)
        if atomic.CompareAndSwapPointer(&s.head, top, unsafe.Pointer(new)) {
            return  // won the race
        }
        // lost the race, retry
    }
}
```

No mutex. The `for` loop retries until this thread "wins" the CAS. Under low contention, that's almost always the first attempt.

## Mental Model

Think of it like updating a shared Google Doc with optimistic locking: you load the current version, make your edit locally, then submit with "apply only if still version N." If someone else edited meanwhile, you get a conflict and re-fetch. Locks are like booking a conference room and blocking everyone else out — CAS is like making your change and only committing if the doc hasn't moved.

## Practical Backend Relevance

**High-throughput counters and metrics**: A lock-protected request counter under heavy load creates a serialization point. An atomic counter (which is essentially a single-register lock-free structure) scales linearly across cores.

**Work queues and thread pools**: Lock-free queues (MPMC — multiple producer, multiple consumer) let worker threads pull tasks without a mutex guarding the queue. Go's runtime scheduler uses this internally.

**Reference counting in memory management**: `sync/atomic` or `std::shared_ptr` use CAS-based ref counts. Acquiring a resource doesn't block other threads from doing the same.

**The tradeoff**: Lock-free is harder to reason about. The classic hazard is **ABA** — a pointer changes from A → B → A between your read and CAS, so CAS succeeds even though the structure mutated under you. Languages solve this with tagged pointers or hazard pointers. Also, under extreme contention, CAS retries thrash, and a mutex can actually outperform because it queues waiters instead of spinning.

Lock-free structures are the right tool when you need low-latency under high concurrency and the contention is predictable — not a blanket replacement for locks.
