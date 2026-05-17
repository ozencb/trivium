---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## ACID Properties

A database transaction is a unit of work that must either fully happen or not happen at all. ACID is the set of guarantees a storage engine makes to ensure this—and understanding what each property *costs* changes how you design systems.

**Atomicity** means all writes in a transaction commit or none do. The mechanism is a write-ahead log (WAL): the engine records intent before touching data pages. On crash, it replays or rolls back from the log. Cost: every write touches disk twice—log first, then the data file.

**Consistency** is the weakest of the four in terms of engine responsibility. It means the database moves from one valid state to another, where "valid" is defined by your constraints (foreign keys, `NOT NULL`, check constraints). The engine enforces schema rules; business logic consistency is still your problem. Misunderstanding this is a common source of bugs—developers assume the DB enforces invariants they never actually declared.

**Isolation** is where most of the complexity lives. Concurrent transactions must behave *as if* they ran serially. But "as if" is doing a lot of work—there are four standard isolation levels (Read Uncommitted → Serializable), each trading correctness anomalies for throughput. Postgres uses MVCC (Multi-Version Concurrency Control): readers get a snapshot of the data at transaction start, so reads never block writes. MySQL InnoDB uses row-level locking with gap locks. Serializable isolation—the strongest—adds conflict detection overhead that can cut throughput by 30–50% under contention.

**Durability** means committed data survives crashes. The engine flushes the WAL to durable storage before acknowledging a commit (`fsync`). This is why `fsync=off` is dangerous but fast—you're trading crash safety for write throughput. Cloud-managed databases often implement durability via synchronous replication across AZs rather than local disk.

**Mental model**: Think of a bank transfer. Atomicity ensures both the debit and credit happen or neither does. Consistency ensures the balance constraint (no negative accounts) holds. Isolation ensures another transaction reading balances mid-transfer sees either the before or after state, not the in-between. Durability ensures the committed transfer survives a server restart.

**In practice:**

- **Backend**: Pick isolation level deliberately. `READ COMMITTED` (Postgres default) prevents dirty reads but allows non-repeatable reads—fine for most APIs, wrong for financial report generation. Use `REPEATABLE READ` or `SERIALIZABLE` when correctness matters more than throughput.

- **Fullstack**: Long-running transactions (holding a connection open while waiting on user input) destroy connection pool capacity. Keep transactions tight around DB operations, not around user-facing request/response cycles.

- **Data**: ETL pipelines often sacrifice isolation for throughput—bulk loads in `READ UNCOMMITTED` or outside a transaction entirely. Know which ACID guarantees you've opted out of and whether your pipeline can tolerate partial visibility.

The real skill is knowing which guarantees you're *actually* getting vs. which you're assuming. Most outages involving data corruption trace back to an isolation level mismatch or a silent violation of a consistency constraint that was never declared.
