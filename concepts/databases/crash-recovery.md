---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Crash recovery is the mechanism that brings a database back to a consistent, durable state after an unclean shutdown — it's the enforcement arm of the "D" in ACID.

## The Core Mechanism

You already know the WAL writes every change before it touches actual data pages. Crash recovery works by replaying that log. The dominant algorithm is ARIES (used by Postgres, MySQL InnoDB, and most serious databases), and it operates in three phases:

**1. Analysis** — Scan forward from the last checkpoint to rebuild two things: which transactions were active (not yet committed) at crash time, and which data pages were "dirty" (modified in memory, not necessarily flushed to disk).

**2. Redo** — Replay *all* logged operations forward from the oldest dirty page, including uncommitted transactions. This sounds wrong but it's intentional — after redo, the on-disk state mirrors what was in memory the instant before the crash. This is called the "repeating history" principle.

**3. Undo** — Walk backward through the log and reverse all operations belonging to transactions that weren't committed. The database is now consistent: only committed work survives.

The key insight is that redo and undo are separate concerns. Redo restores durability (committed data isn't lost). Undo restores atomicity (partial transactions are invisible).

## A Mental Model

Think of it like ledger reconciliation after a bank's systems go offline mid-day. You don't throw out the day's records — you replay every transaction to get back to the exact state at cutoff, then reverse any that weren't fully authorized. The ledger (WAL) is ground truth; the database pages are just a cache of it.

## Practical Scenarios

**Backend:** Your app's Postgres pod gets OOM-killed during a bulk insert — 50,000 rows half-written. On restart, Postgres runs recovery automatically. Committed batches survive; the in-flight one vanishes cleanly. Your connection pool reconnects and the schema is fully consistent. No manual intervention needed, no corrupt rows.

**SRE:** Recovery time scales with the gap between the last checkpoint and the crash point. If checkpoints are infrequent (Postgres defaults to every 5 minutes or 1GB of WAL), a crash could mean minutes of replay on a busy system. This directly sets your RTO floor. Tuning `checkpoint_timeout` and `checkpoint_completion_target` isn't just about write performance — it's about how long the database is unavailable after an incident.

Also: WAL segment loss or corruption breaks recovery entirely. This is why WAL archiving is non-negotiable for any production database — it's not just for PITR, it's crash recovery insurance if your primary's local WAL gets corrupted.

## What People Miss

Recovery is not "restore from backup." It happens automatically on every unclean restart, takes seconds to minutes, and is completely transparent. Most engineers only notice it's happening when they see `LOG: database system was not properly shut down` in the Postgres logs. By then, it's already done.
