---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Two-Phase Locking

Two-Phase Locking (2PL) is the classical protocol for achieving serializability in a concurrent database. The core problem it solves: without coordination, interleaved reads and writes across transactions can produce results that no serial execution of those transactions could have produced — fundamentally corrupting your data's logical consistency.

### The Mechanism

2PL enforces one invariant: **once a transaction releases a lock, it may never acquire another.** This splits every transaction's lifetime into two distinct phases:

- **Growing phase** — locks are acquired, none released
- **Shrinking phase** — locks are released, none acquired

The transition point — where the transaction holds its maximum lock set — is called the *lock point*. This is where 2PL's correctness guarantee comes from. Each transaction's lock point defines a moment in time at which it effectively "owns" all the data it will ever touch. The set of lock points across all concurrent transactions induces a total ordering, which corresponds to a valid serial schedule. That's the proof sketch behind why 2PL guarantees serializability.

### Mental Model

Imagine you're auditing a ledger and need to read five accounts to produce a consistent report. Basic mutual exclusion (a plain mutex) just stops two threads from touching the same row simultaneously — but it doesn't prevent you from reading account A (and releasing that lock), then having someone else modify A before you've finished reading accounts B through E. Your report is now inconsistent, but no lock was violated.

2PL prevents this by forbidding lock release until you're done acquiring. You hold all five read locks simultaneously, produce your consistent snapshot, then release. No one can mutate your data mid-computation.

### Variants in Practice

Most databases don't implement vanilla 2PL because the shrinking phase can start before commit, which creates cascading abort scenarios. Instead they use **Strict 2PL**: write locks are held until commit, preventing other transactions from reading uncommitted data. PostgreSQL's `SERIALIZABLE` level and MySQL's InnoDB locking both approximate this.

### Backend Scenario

When you issue `SELECT ... FOR UPDATE` inside a transaction, you're manually participating in 2PL — acquiring a write lock in the growing phase. If two transactions both do this on overlapping rows in opposite order, you get a deadlock. The database detects this via a wait-for graph (a cycle means deadlock) and kills one transaction. Understanding 2PL makes this behavior predictable rather than mysterious.

### Data Engineering Scenario

Batch ETL jobs that run concurrent writes into the same tables hit 2PL contention hard — long-running transactions hold large lock sets, and everything else queues behind them. This contention is precisely why MVCC (Multi-Version Concurrency Control) emerged as an alternative: readers get a snapshot and never block writers, trading the strict serializability of 2PL for better throughput under read-heavy workloads.
