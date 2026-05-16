---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Deadlocks

A deadlock is a state where two or more threads are permanently blocked, each waiting for a resource held by another. Unlike a livelock or starvation, nothing moves — ever — without external intervention.

### The Mechanism

Four conditions must hold simultaneously (Coffman conditions). Break any one and deadlock is impossible:

1. **Mutual exclusion** — resources can't be shared concurrently
2. **Hold and wait** — a thread holds at least one resource while waiting for another
3. **No preemption** — resources can't be forcibly taken; the holder must release
4. **Circular wait** — there's a cycle in the wait-for graph: A waits on B, B waits on A (or longer chains)

Two-phase locking is particularly susceptible because threads acquire locks incrementally, making circular wait easy to accidentally construct.

### Mental Model

Imagine two people at a dinner table. One holds a fork, reaches for a knife. The other holds the knife, reaches for a fork. Both wait indefinitely. The table never clears. The lock-acquisition order diverged, and now neither can proceed.

The wait-for graph is the formal version of this: nodes are threads, edges point from "waiting" to "holds". A cycle in this graph *is* the deadlock.

### Backend Scenario

Classic REST service deadlock: request A locks `user_id=1` then tries to lock `account_id=7`. Concurrently, request B has locked `account_id=7` and is trying to lock `user_id=1`. Both spin on the second lock. Connection pool exhausts. Service goes dark.

The fix is almost always **consistent lock ordering** — always acquire `user` before `account`, across every code path. This eliminates circular wait by construction. Many teams enforce this with a numeric lock hierarchy (lower ID acquired first).

### Data Scenario

In Postgres, deadlocks happen more than people expect because row-level locks are implicit. Two transactions updating the same two rows in opposite order — e.g., `UPDATE orders WHERE id IN (1,2)` processed in different sequences — will deadlock. Postgres detects this via a background lock monitor and kills one transaction with `ERROR: deadlock detected`. The application must retry.

Batch operations are especially vulnerable. If you process a list of IDs without sorting them first, the ordering is nondeterministic across concurrent requests, and deadlocks become probabilistic and hard to reproduce.

### Detection vs. Prevention

- **Detection** (Postgres's approach): let deadlocks happen, detect cycles in the wait-for graph, abort a victim. Simple but adds latency and requires retry logic.
- **Prevention** (lock ordering): eliminate circular wait statically. More discipline required upfront, zero runtime cost.
- **Avoidance** (e.g., Banker's algorithm): theoretically elegant, rarely practical in real systems due to overhead.

For most production systems, lock ordering + short transactions + retry-on-deadlock covers the vast majority of cases.
