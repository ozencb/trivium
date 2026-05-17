---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Replication Lag

Replication lag is the delay between a write committing on the primary and that write appearing on replicas. The practical consequence: reads from replicas may return stale data, and engineers who don't account for this ship subtle, hard-to-reproduce bugs.

**Core mechanism**

In async replication — the default for MySQL, Postgres streaming replication, MongoDB — the primary acknowledges the write to the client *before* replicas confirm receipt. Each replica independently applies the write log (binlog, WAL, oplog) at its own pace. Under normal conditions lag is milliseconds. But it's not zero, and under load, during network hiccups, or when a replica falls behind on applying writes, it can reach seconds or minutes.

The mental model: replicas are running behind the primary's write position. Reads routed to replicas are queries against an older snapshot of the world. The snapshot's age is the lag.

**Concrete example**

A user updates their email. The write goes to primary. Your app immediately redirects them to a profile page — that read hits a replica. If lag is 200ms, the replica still returns the old email. The user sees stale data seconds after they changed it. This is invisible in development (where replica lag is near-zero) and surfaces in production under load, which is exactly when it's hardest to diagnose.

**Backend**

The pattern to reach for: route reads immediately following a write to the primary, or implement read-your-writes by tracking the primary's write position (Postgres `pg_current_wal_lsn`, MySQL GTIDs). Some ORMs handle this transparently. The mistake: assuming the load balancer handles it, or that "low lag" means safe.

**SRE**

Rising replica lag is an early warning signal — the replica may be CPU-bound applying writes, blocked by a long-running query, or on degraded disk. Alerting on `replica_lag_seconds > 30` is standard. When lag spikes, read traffic that was safely offloaded to replicas becomes a consistency hazard, and promoting that replica during failover risks data loss or serving stale state at scale.

**Data**

ETL pipelines reading from replicas can silently miss rows from an in-flight multi-row write if lag is high enough. For reporting on "current" state, you either read from primary or establish an explicit staleness budget and document it.

**The senior differentiator**

The question in a design discussion isn't "should we read from replicas?" — it's "which reads can tolerate stale data, and how stale?" Framing it that way signals you understand it as a tradeoff to reason about, not a fact to work around. That distinction consistently separates senior engineers from mid-level in system design conversations.
