---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Crash Recovery

After an unclean shutdown, a database can't trust what's on disk — a committed transaction might not have flushed its pages, and an uncommitted one might have partially written. Crash recovery is the process of bringing the database back to a consistent state using the WAL as the source of truth.

### The mechanism

Recovery happens in three phases (ARIES is the canonical algorithm):

**Analysis**: Scan the WAL forward from the last checkpoint to reconstruct which transactions were in-flight at crash time, and which dirty pages hadn't been written back to disk.

**Redo**: Replay *all* logged operations forward from the oldest dirty page — even ones belonging to transactions that never committed. This gets disk back to exactly the state it was in at the crash moment.

**Undo**: Walk backward through the log, rolling back every transaction that was active but never committed. These get "compensating" log records written so that if *another* crash happens mid-recovery, the undo work isn't repeated.

The key invariant: the WAL is written before the page it describes. So any committed transaction is fully represented in the log, even if its pages never made it to disk. Any uncommitted transaction might be partially in both — hence the redo-then-undo sequence.

### Mental model

Think of the WAL as a court transcript and the data pages as a whiteboard. The whiteboard might be in any state after a power cut. Recovery re-reads the transcript to figure out the final authoritative state — replaying legitimate writes, erasing unauthorized ones.

Checkpoints exist to bound how far back you need to replay. Without them, recovery would replay from the beginning of time.

### Practical implications

**For backend engineers**: This is why `fsync` matters. If your OS or storage layer lies about data being durable (common with certain cloud disk types or RAID controllers with write caching), the WAL assumptions break. A crash can leave the log in a state where "committed" log records never actually hit stable storage. Postgres's `synchronous_commit` and `fsync` settings directly trade durability guarantees against write latency — know what you're turning off when you disable them.

**For SREs**: Recovery time is bounded by the distance between checkpoints and how much redo work accumulates. Under heavy write load, if you crank up `checkpoint_completion_target` too high or reduce checkpoint frequency, you're trading slower recovery time for smoother I/O. A database that crashed under load might take minutes to recover — this is expected, not a bug. Monitoring `pg_stat_bgwriter` or equivalent gives you visibility into checkpoint pressure before it becomes a problem.

The failure mode to watch for: "torn writes" — where a single 8KB page write is split across a power failure, leaving half old data and half new. Postgres uses full-page writes to mitigate this: after each checkpoint, the first write of a page includes the full page image in the WAL so recovery can restore it cleanly.
