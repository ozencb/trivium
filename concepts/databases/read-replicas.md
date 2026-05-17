---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Read Replicas

Read replicas are asynchronous copies of your primary database that serve read traffic, letting you scale query throughput horizontally without sharding or upgrading hardware. The core motivation: most applications are read-heavy, and your primary database is spending most of its IOPS answering `SELECT`s that could run elsewhere.

**The mechanism**

The primary streams its write-ahead log (WAL) or binlog to replicas, which apply changes in order. Replicas are always slightly behind—lag is real and variable, ranging from milliseconds under low write load to seconds (or more) when the primary is hammered or the replica is catching up after a restart. This is not a bug you can engineer away; it's intrinsic to async replication.

Your application must be aware of this. Read your own writes from the primary. Everything else—dashboards, search, list pages, analytics—can go to a replica.

**Mental model**

Think of it like a library that makes photocopies of its catalog. Someone can look up books in the photocopy room (replica) rather than bothering the head librarian (primary). The catch: if a new book was just added, the photocopy might not reflect it yet. You don't let someone look up their just-returned book in the photocopy room—you send them to the librarian directly.

**In practice**

*Backend*: Route reads via a connection pool that distinguishes primary vs. replica. Common pattern: use the primary for anything within a user's session after a write (e.g., redirect-after-post reads the primary). Libraries like PgBouncer or application-level proxy middleware handle this routing. A subtle failure mode: serving stale session data because a replica hasn't caught up yet—users see "reverted" state after edits, which looks like a bug.

*SRE*: Replicas give you read capacity headroom and also serve as hot standbys for failover. Monitor replica lag as a first-class metric—spikes in lag under write load indicate the replica is falling behind and stale reads are increasingly likely. Lag under 100ms is usually fine; lag over a few seconds needs attention. Also, replicas under heavy read load can actually *increase* lag if I/O is saturated.

*Data*: Analytical queries are natural candidates for replicas—long-running aggregations that would block or compete with OLTP traffic on the primary. Just know that reports run against a replica might undercount very recent data. Often acceptable; sometimes not (financial reports, compliance). Some teams promote a dedicated replica that's intentionally one replication cycle behind for stable reporting snapshots.

**When to reach for this**

When read query load is visibly straining the primary and you haven't exhausted caching options. Before adding replicas, ensure you've tuned slow queries and added appropriate indexes—replicas scale throughput, not query efficiency.
