---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## MVCC (Multi-Version Concurrency Control)

Instead of locking rows so readers and writers don't collide, MVCC lets them coexist by keeping multiple versions of each row — readers see an older snapshot, writers create new versions. This eliminates the most painful bottleneck in 2PL: readers blocking writers and vice versa.

### The core mechanism

Every row carries hidden metadata: the transaction ID that created it and the transaction ID that deleted or replaced it. When a transaction starts, it's assigned a transaction ID and takes a snapshot — a point-in-time view of which transaction IDs are committed. A row is visible to your transaction if it was created by a committed transaction that started before your snapshot, and not yet deleted (or deleted by a transaction that started after yours).

When you `UPDATE` a row, the database doesn't overwrite it. It marks the old version as expired (using your transaction ID) and inserts a new version. Both versions coexist on disk until garbage collection removes the old one.

### Mental model

Think of it like Git. Each row write is a commit. When you start a transaction, you're doing a `git checkout` at a specific commit hash. Other transactions can keep committing new changes, but your view of the world is frozen at your snapshot. When you commit, you're merging your branch — and if someone else modified the same rows, you might get a conflict.

### Where this matters in practice

**Backend:** This explains the behavior you've probably seen but maybe not fully attributed — you read a row, do some work, then try to update it and get a serialization error or a lost update. Your transaction's snapshot was taken at start, so you might be operating on stale data by the time you write. Libraries like SQLAlchemy's `SELECT FOR UPDATE` or explicit optimistic locking patterns exist specifically because MVCC doesn't protect you from write-write conflicts — it only handles read-write contention.

**Data:** MVCC is why Postgres can run a multi-minute analytical query without blocking your app's OLTP writes. The analytical query holds a snapshot; OLTP writes create new versions that the analytical query simply doesn't see. This is the architecture that makes "run analytics on prod" even remotely viable, and it's why data warehouse patterns on Postgres (or tools like Redshift, which uses a similar model) don't need separate read replicas just for query isolation.

### The tradeoffs

- Old row versions accumulate until cleaned up — Postgres's `VACUUM` exists for this reason. Heavy write workloads on long-running transactions can cause table bloat.
- Write-write conflicts still need explicit handling. MVCC only sidesteps read-write contention.
- Snapshot isolation (what most databases actually implement) is weaker than full serializability — you can still get write skew anomalies unless you use `SERIALIZABLE` isolation, which adds another layer of conflict detection on top of MVCC.
