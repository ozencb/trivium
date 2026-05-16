---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Write-Ahead Log (WAL)** is a durability mechanism that persists a description of every change *before* applying it to data files. The "before" is the whole point: it lets you reconstruct the correct database state after a crash, even if the actual data pages never made it to disk.

## The Core Mechanism

You already know that the buffer pool defers writes — dirty pages sit in memory and get flushed lazily. The problem is that a crash can happen between when a transaction commits and when its pages reach disk. Without something else, that committed data is gone.

WAL solves this by flipping the write order. Before a transaction commits, the database writes a log record to a sequential append-only file: what changed, on which page, what the before-value was, what the after-value is. Only after that log record is `fsync`'d to disk is the commit acknowledged to the client. The actual data page can still be dirty in the buffer pool — that's fine. On crash, the engine replays the log (redo) and rolls back incomplete transactions (undo).

The log is sequential and append-only by design. Sequential disk writes are drastically faster than the random I/O that updating scattered data pages would require. You're trading two writes (log + eventual data page) for durability, but the log write is fast enough that it barely shows up in latency.

## Mental Model

Think of it like a ledger at a bank. Before the teller moves money between accounts, they record the transfer in the ledger. If the power goes out mid-transfer, they don't guess at the account balances — they replay the ledger. The ledger *is* the authoritative record; the account balances are just a derived view.

## Practical Angles

**Backend:** Every production database you've used runs on WAL. In Postgres, `wal_level`, `synchronous_commit`, and `checkpoint_timeout` are tuning knobs that trade durability guarantees against write throughput. Turning off `synchronous_commit` (async mode) means WAL records aren't fsynced before ACK — you get faster writes but risk losing the last few transactions on crash.

**Data:** WAL is what makes Change Data Capture (CDC) possible. Tools like Debezium or Kafka Connect tail the WAL directly to stream every row-level mutation without polling. Logical replication in Postgres (`wal_level = logical`) is literally publishing WAL records in a decoded format.

**SRE:** WAL lag is a first-class operational metric. On a streaming replica, "replication lag" means the standby is behind the primary's WAL position. If WAL accumulates faster than replicas consume it, you'll hit `max_wal_size` limits and risk forced checkpoints — or worse, the primary holding WAL segments indefinitely, eating disk. This is why monitoring `pg_replication_slots` and replica lag are table stakes for any Postgres deployment you care about.

Understanding WAL directly unlocks how crash recovery and replication work — both are just different consumers of the same log.
