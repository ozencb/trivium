---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Database replication** is the continuous process of propagating writes from one node (the primary) to one or more others (replicas), so your data survives node failure and read load can be distributed.

## Core mechanism

Since you know WAL: replication is essentially WAL shipping. The primary writes to its WAL as usual, and replicas receive and replay that stream. Two main modes:

**Physical (streaming) replication** — the replica receives raw WAL bytes and applies them in order, ending up byte-for-byte identical to the primary. This is what Postgres streaming replication does by default.

**Logical replication** — the primary decodes WAL into row-level change events (INSERT/UPDATE/DELETE) and ships those. More flexible: you can replicate to a different schema, a different Postgres major version, or filter to specific tables.

The replica tracks its position via an LSN (Log Sequence Number in Postgres) — essentially a cursor into the WAL. It continuously asks "give me everything after position X."

**Sync vs. async** is the critical tradeoff: async replication (default) lets the primary acknowledge a write after its own WAL write, without waiting for replicas. This creates **replication lag** — replicas trail behind by milliseconds to seconds under normal load, more under pressure. Synchronous replication makes the primary wait for at least one replica to confirm receipt before acknowledging, eliminating lag but adding latency to every write.

## Mental model

Think of it like a distributed event log with a subscriber. The primary is the producer; replicas are consumers that can fall behind. Lag is the distance between the producer's head and a consumer's cursor.

## Practical scenarios

**Backend:** Read replicas let you offload SELECT queries from the primary. The trap: a user writes data, immediately reads it back, hits a lagging replica, and sees stale state. Common fixes are read-your-writes routing (send reads to primary for N seconds post-write), or accepting eventual consistency where staleness is tolerable.

**SRE:** Failover correctness depends entirely on replication state at the moment of failure. If the primary crashes with async replication, the replica you promote may be 500ms behind — those writes are gone. Replication lag in bytes and seconds should be a first-class alert, not an afterthought.

**DevOps:** HA tooling like Patroni or ProxySQL automates failover by picking the most-caught-up replica. Schema migrations are trickier: a DDL on the primary replicates to replicas, but if replicas can't apply it (incompatible change, lock contention), replication breaks. Zero-downtime migrations need to account for the replication path, not just the primary.
