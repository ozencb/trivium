---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Database Transactions

A transaction is a boundary around a set of reads and writes that the database treats as a single indivisible operation — either all of it commits or none of it does. The "why" is deceptively deep: without transactions, interleaved concurrent operations produce results no single client ever intended.

**The core mechanism**

You already know 2PL, so the pieces are familiar: transactions acquire locks as they go, and the ACID guarantees fall out of how those locks interact. What's worth internalizing is that *isolation* is the hard part. Atomicity and durability are mostly engineering — write-ahead logs, crash recovery. Isolation is a fundamental tradeoff: the stronger the isolation, the more transactions block each other.

The four standard isolation levels form a spectrum by the anomalies they permit:

- **Read committed** — no dirty reads, but you can get different values on repeated reads within the same transaction (non-repeatable read)
- **Repeatable read** — same row always returns the same value, but phantom reads (new rows appearing mid-transaction) are still possible
- **Serializable** — behaves as if transactions executed one at a time, no anomalies

Most databases default to read committed. PostgreSQL's "repeatable read" actually uses MVCC snapshots and prevents phantoms too. MySQL's InnoDB repeatable read does not. The standard is a floor, not a spec.

**Concrete mental model**

Imagine a transfer of $100 between accounts. The naive version: read balance A, subtract 100, write A, read balance B, add 100, write B. Without a transaction, a concurrent reader can see A debited but B not yet credited — money briefly disappears. With serializable isolation, no reader ever observes that intermediate state. The invariant (A + B = constant) holds at every observable point.

**Where this bites in practice**

*Backend:* The classic mistake is holding a transaction open while making an HTTP call or acquiring an external lock. Long-running transactions hold locks, blocking other writers, degrading throughput. Keep transactions short — fetch everything you need first, then compute, then open the transaction and write.

*Fullstack:* Optimistic concurrency (check-then-act) breaks silently without serializable isolation or explicit row locking. If two users read a record, both decide to update it, and you're on read committed, one update silently wins without the other ever knowing. Either bump isolation, use `SELECT FOR UPDATE`, or move to optimistic locking with version columns.

*Data:* ETL pipelines on read committed can produce inconsistent snapshots — you read some tables early in a long job, others later, and concurrent writes land in between. Either use a serializable read-only transaction, or snapshot via MVCC (PostgreSQL's `REPEATABLE READ` for reads is cheap — no locks, just a snapshot).

The practical rule: default to read committed for throughput, reach for serializable when correctness requires it, and always be suspicious of anything that reads-then-writes based on that read.
