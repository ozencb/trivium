---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Multi-Version Concurrency Control (MVCC)

MVCC solves reader-writer contention by keeping multiple versions of each row rather than forcing readers to wait for writers. Instead of lock-based blocking, each transaction gets a consistent snapshot of the database at the moment it starts — readers and writers proceed independently.

**The mechanism**

Every row carries version metadata: in PostgreSQL, each tuple has `xmin` (the transaction ID that created it) and `xmax` (the transaction ID that deleted or superseded it). When a transaction begins, it captures a snapshot — essentially a record of which transaction IDs had committed at that instant. A row is visible to a transaction if its `xmin` is in the snapshot's committed set and its `xmax` is not. Writers insert new row versions; they never modify the old ones in place. Old versions accumulate until `VACUUM` reclaims them, which is why long-running transactions on write-heavy tables cause table bloat.

**Mental model**

Think of it as per-row Git history. A reader checks out the commit at their transaction's start time and sees a frozen view. A writer creates a new commit. Neither operation touches the other's view. The "current" version is just the latest commit; older ones persist until garbage collected.

**Where it breaks: snapshot isolation anomalies**

MVCC typically gives you snapshot isolation, which is *not* the same as serializability. The classic trap is **read skew**:

- T1 reads account A (balance: 100), then reads account B (balance: 200)  
- T2 transfers 100 from A→B and commits between T1's two reads  
- T1 sees A=100 (old version) and B=300 (new version) — a total of 400 that never existed atomically

Each individual read was internally consistent, but T1 observed a state the database never actually had. **Write skew** is the same pattern under writes: two transactions each read overlapping data and make decisions that would conflict if they'd seen each other's writes.

**Practical implications**

*Backend:* "Read, check, write" logic is not safe under snapshot isolation. If you read a row to validate a constraint and then write based on that, another transaction can sneak in between. You need `SELECT FOR UPDATE` to acquire a row lock, or bump to `SERIALIZABLE` isolation. Most ORMs default to snapshot isolation without advertising it.

*Data/analytics:* Long-running analytical queries hold their snapshot open, which prevents VACUUM from reclaiming dead tuples for the entire duration. A single forgotten `idle in transaction` connection can cause unbounded table bloat proportional to the write rate during its lifetime. Monitoring `pg_stat_activity` for long-running transactions is standard PostgreSQL ops hygiene for this reason.

**The design interview edge**

The differentiating knowledge: snapshot isolation has anomalies that serializable doesn't; `REPEATABLE READ` in MySQL gives snapshot isolation while in PostgreSQL it additionally prevents certain phantom reads; and "reads don't block writes" is a tradeoff, not a free lunch — version storage and GC overhead are real costs that show up under high write throughput.
