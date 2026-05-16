---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Race Conditions

A race condition occurs when the correctness of a program depends on the relative timing of concurrent operations — and that timing isn't guaranteed. They're subtle because the code looks correct in isolation; the bug only manifests when two threads of execution interleave in a specific way.

### The Core Mechanism

The fundamental issue is that operations you think of as atomic often aren't. Consider `counter++`. At the machine level this is: read the value, increment it, write it back — three distinct steps. If two threads execute this "simultaneously," both can read the same initial value, both increment their local copy, and both write back — losing one increment entirely. The window of vulnerability between read and write is called a **critical section**.

The nasty part: this doesn't always fail. Most of the time the scheduling works out fine. Race conditions are heisenbugs — they appear intermittently, often under load, and vanish when you add logging (which changes timing).

### Mental Model

Think of two people editing the same Google Doc, but with a 10-second sync delay. Person A reads "Total: 5", adds 3, and will write "Total: 8". Person B reads "Total: 5" at the same time, adds 1, will write "Total: 6". Last write wins — you lose an update. This is check-then-act: the state you checked is no longer valid by the time you act on it.

### Backend Scenarios

**Inventory systems**: You check that stock > 0, then decrement. Under concurrent requests, two buyers can both pass the check before either decrement lands. Result: overselling.

**Job queues**: A worker checks if a job is "pending", marks it "processing", starts work. If the check and update aren't atomic, two workers claim the same job.

**Balance transfers**: Read balance, verify sufficient funds, deduct. Classic lost-update problem under concurrent transfers.

The fix is usually one of: a database transaction with proper isolation, a `SELECT FOR UPDATE` pessimistic lock, or an atomic CAS (compare-and-swap) operation. This is exactly what **optimistic locking** and **MVCC** solve — they let you detect that the state changed between your read and write, rather than preventing concurrent reads entirely.

### Fullstack Scenarios

**Double-submit prevention**: User clicks "Pay" twice fast. Both requests hit the server before either response lands. Without idempotency keys or a database-level unique constraint, you charge them twice.

**Optimistic UI updates**: Frontend updates local state immediately, fires the API call. If two tabs do this concurrently to the same resource, the last write wins and one user's change silently disappears.

**Session state**: Reading then writing session data (e.g., cart operations) without locking can corrupt state under concurrent requests from the same user.

The key shift in thinking: stop reasoning about individual operations and start reasoning about **interleavings**. Any time two concurrent actors touch shared mutable state, assume the worst-case ordering is possible.
