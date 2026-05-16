---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Two-Phase Locking (2PL)

Two-phase locking is a protocol that guarantees **serializability** — the strongest correctness guarantee for concurrent transactions — by enforcing a simple invariant on when locks can be acquired and released.

### The Core Idea

Every transaction goes through exactly two phases:

1. **Growing phase**: acquire locks freely, release none
2. **Shrinking phase**: release locks, acquire none

The rule is: once you release *any* lock, you're done acquiring locks forever. This creates a "lock point" — the moment a transaction holds its maximum set of locks — and it's this point that defines the transaction's position in the serial order.

Why does this work? Because if transaction T1's lock point comes before T2's, then T1 had exclusive access to every resource it touched before T2 could claim them. That's equivalent to T1 running completely before T2. The lock point creates a total ordering, which is serializability.

### A Concrete Mental Model

Think of a library where you're only allowed to check out books, then return them — you can't return one book and check out another. The moment you return your first book, you're committed to releasing everything. This forces an ordering: whatever books you had checked out simultaneously define your "slot" in the overall sequence.

In practice, most databases use **Strict 2PL**: hold *all* locks until commit or abort. This prevents a subtler problem — if T1 releases a row lock early and T2 reads that row, then T1 aborts, T2 has read data that never existed (a "dirty read"). Strict 2PL eliminates this by keeping locks through the commit boundary.

### Backend Context

When you set `SERIALIZABLE` isolation in Postgres or MySQL, the engine is essentially enforcing 2PL (or a variant of it). That's why serializable transactions are slower — contention on locks can stack up. If two transactions try to lock the same rows in opposite orders, you get a **deadlock**: T1 holds row A waiting for B, T2 holds B waiting for A. Neither can proceed. 2PL doesn't prevent deadlocks; it just makes them detectable (via cycle detection in the waiter graph).

### Data/Analytics Context

Long-running analytical queries are why MVCC exists. Under strict 2PL, a read locks rows and blocks writers for the duration of a multi-minute scan — unacceptable for OLTP workloads. MVCC sidesteps 2PL for reads entirely by giving each reader a snapshot, which is why understanding 2PL's limitations is the prerequisite for understanding why MVCC was invented and what tradeoffs it makes.

---

The key insight to carry forward: 2PL's correctness comes from the lock point creating a total order, but the cost is that readers and writers contend, and deadlocks become possible. Both MVCC and deadlock detection exist as direct responses to these two problems.
