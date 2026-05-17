---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Write-Ahead Log (WAL)

WAL solves a core tension in durable storage: you need atomicity and crash safety, but flushing every data page to disk on each commit is prohibitively slow. The solution is to write a compact, sequential record of *intent* before touching the actual data pages — the log becomes the source of truth, and data pages become a lazily-updated projection of it.

### The Invariant

The rule is strict: **a log record must reach durable storage before its corresponding data page modification can be considered committed**. That's it. This single invariant is what makes crash recovery possible. If the database crashes mid-operation, the log tells you exactly what happened and what didn't — you either redo completed-but-not-flushed operations, or undo uncommitted ones.

### Why It Actually Works

Each log record carries a **Log Sequence Number (LSN)** — a monotonically increasing identifier. Each dirty page in the buffer pool tracks the LSN of the most recent WAL record that touched it (`pageLSN`). On crash recovery, the database walks the log, compares `pageLSN` against what the log says should be there, and replays the delta. Postgres, MySQL InnoDB, and SQLite all implement variations of this (Postgres calls its recovery algorithm similar to ARIES).

The reason this is faster than synchronous page flushes: log writes are **sequential**. Appending to a log is one `fsync` at the end of a segment, not random I/O scattered across a 16KB-page heap. You trade expensive random writes for cheap sequential ones, deferring the actual page flushes to background checkpointing.

### Concrete Mental Model

Think of it like a bank ledger. Before a teller moves cash between drawers, they write the transaction in the ledger. If the power goes out mid-transfer, you reconstruct the correct state from the ledger — you don't try to infer it from the physical state of the cash drawers.

### Practical Angles

**Backend**: If you're using Postgres and seeing commit latency spikes, `wal_sync_method` and `synchronous_commit` are your levers. Disabling `synchronous_commit` trades durability guarantees for throughput — the server acknowledges commits before the WAL flushes, which is fine for some workloads and dangerous for others.

**Data**: CDC tools (Debezium, logical replication) work by *tailing the WAL*. The WAL isn't just for recovery — it's a complete, ordered change history. This is why WAL-based replication is more reliable than trigger-based approaches; you're reading the true source of mutation order.

**SRE**: Checkpoint frequency directly impacts recovery time. A database that hasn't checkpointed in an hour may need to replay an hour of WAL on restart. Tuning `checkpoint_completion_target` and monitoring checkpoint lag matters for RTO. Also: WAL segment accumulation during high write volume or replication lag can fill disks silently.

Understanding WAL is the prerequisite for reasoning clearly about replication lag, point-in-time recovery, and why crash recovery is bounded and deterministic rather than fuzzy.
