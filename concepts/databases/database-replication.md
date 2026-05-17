---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Database Replication

The primary node writes every change to its WAL before applying it locally — replication exploits this by shipping those same WAL entries to one or more replica nodes, which replay them in order. The result is a byte-for-byte copy of the primary's data, maintained continuously, that can serve reads without touching the primary.

**The core mechanism**

In streaming replication (Postgres's default), the replica opens a persistent connection to the primary and requests WAL records starting from its current LSN (log sequence number). The primary sends records as they're written — the replica applies them and advances its LSN. The replica is always *replaying history*, never making independent decisions about data.

The critical choice is **synchronous vs. asynchronous**:

- **Async**: Primary commits without waiting for replica acknowledgment. Low write latency, but if the primary crashes before the replica catches up, you lose those writes. The replica's copy is *eventually consistent*.
- **Sync**: Primary waits until at least one replica has written the WAL entry to durable storage before acknowledging the commit. You get a durability guarantee across nodes, but every write now has network round-trip added to its latency.

**Mental model**

Think of the WAL as a shared append-only log. The primary is the writer; replicas are consumers playing catch-up. As long as they consume in order and don't skip entries, they'll converge on identical state. The "lag" is just how far behind in the log each replica is.

**In practice**

*Backend*: Route `SELECT` queries to read replicas to offload the primary. Works well for dashboards, reporting, and read-heavy API endpoints — but be aware of replication lag. If a user writes data and immediately reads it back through a replica, they might see stale state. Apps that can't tolerate this need to read from primary after writes (or use sync replication).

*SRE*: Replication lag (`pg_stat_replication`, `seconds_behind_master` in MySQL) is a key health signal. A replica that's falling behind under load is a ticking clock — if it lags too far and the primary's WAL is retained only for N hours, the replica can't reconnect after a failure. Replica promotion during failover requires understanding *which* replica is most caught up to minimize data loss.

*DevOps*: Replication topology decisions are infrastructure decisions. Async replicas in the same datacenter are cheap insurance for read scaling. Sync replicas in a second AZ give you failover guarantees at the cost of cross-AZ write latency. Cascading replication (replica of a replica) can distribute WAL load but deepens the lag chain.

The key invariant: replicas are only as fresh as their lag allows. Design your read paths around whether staleness is acceptable, not around the assumption that replicas are always current.
