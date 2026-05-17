---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Race Conditions

A race condition occurs when a program's correctness depends on the relative timing of concurrent operations — two or more threads read and write shared state, and the final outcome varies based on which thread "wins" an implicit race. The bug isn't in any single thread; it's in the *combination* of their interleavings.

### The Core Mechanism

The root pattern is **read-modify-write**: a thread reads a value, computes a new value, then writes it back. The problem is that this is never atomic at the hardware level unless you make it so. Between the read and the write, another thread can read the same stale value, compute its own new value, and write it back — and your write will silently overwrite theirs (or vice versa).

```
Thread A: read balance (100) → compute 100+50 → write 150
Thread B: read balance (100) → compute 100+30 → write 130
Final balance: 130. Lost $50.
```

Both writes succeeded. No exception. No log entry. Just a wrong number.

The non-determinism comes from OS scheduling: threads get preempted at arbitrary instruction boundaries. In testing, you might never hit the interleaving that causes the bug. In production under load, you'll hit it constantly.

### What Makes It Subtle

The pattern isn't always obvious. A counter increment (`x++`) is read-modify-write. A cache invalidation followed by a re-fetch is read-modify-write. Even checking a boolean flag before taking action (`if (!locked) acquire()`) is read-modify-write at the logical level. **Anything with a gap between observation and action is a candidate.**

### Practical Scenarios

**Backend (account balance, inventory):** Classic case. A flash sale reduces stock: `SELECT count WHERE id=X`, then `UPDATE count = count - 1`. Two requests land simultaneously, both read `count=1`, both write `count=0`, you've oversold by one. Fix: atomic `UPDATE ... WHERE count > 0` or a database-level lock.

**Fullstack (optimistic UI + API):** User edits a document. Frontend POSTs changes. Meanwhile another tab (or user) POSTed changes to the same resource. Last-write-wins unless you detect the conflict — which requires the read-modify-write to include a version check (this is exactly what optimistic locking solves, and why it's a natural next concept).

**Session/cache layer:** Two services both check Redis for a cached value, both get a miss, both query the DB, both write to cache. Usually harmless, but in a thundering-herd scenario it's expensive — and if the write involves a counter or aggregation, it's correctness-breaking.

### The Invariant to Protect

The fix is always about making the read-modify-write atomic with respect to other threads: locks, atomic CPU instructions, database transactions, or version-based conflict detection. Recognizing *which* pattern you have determines which tool fits.
