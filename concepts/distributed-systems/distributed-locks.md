---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Distributed locks let a single node claim exclusive access to a shared resource across a cluster, where a local mutex is useless because the competing processes don't share memory.** The fundamental challenge isn't acquiring the lock—it's handling what happens when the holder dies, stalls, or gets partitioned away.

## Core Mechanism

The lock is a key written to a consensus-backed store (etcd, Zookeeper, or Redis in specific configurations). Two invariants make it work:

1. **Linearizable writes**: The consensus system guarantees only one writer "wins" when multiple nodes race to create the same key. This is where consensus algorithms do the heavy lifting—you're delegating the hard problem of mutual exclusion to a system already solving it.

2. **Time-bounded leases (TTL)**: The lock key has an expiry. The holder must periodically send heartbeats to renew it, or complete the critical section before it lapses. This ensures the lock releases even if the holder crashes—liveness without requiring explicit unlock.

The subtle danger: a process can *believe* it holds a lock after the TTL has expired. A GC pause, kernel scheduling delay, or network hiccup long enough to miss heartbeats means another node already acquired the lock before your process woke up. Both nodes now think they hold it.

The solution is **fencing tokens**—a monotonically increasing number issued with each lock grant. Pass it to downstream systems; they reject any request with a stale token. This moves the safety guarantee from "the lock holder knows it holds the lock" (unreliable) to "the resource itself enforces exclusivity" (reliable).

## Mental Model

Hotel key cards with an expiry. Check in → get a card valid for 24h. If you vanish, the room becomes available after 24h without staff intervention. If the hotel issues a new card to someone else, your old card stops working at the door—even if you think you're still a guest.

## Practical Scenarios

**Backend**: Singleton job scheduling—you have 10 instances running but only one should run the nightly data export. Each instance races to acquire a lock at startup; the winner runs the job, others skip. Also useful for cache stampede prevention: one instance acquires a lock to rebuild an expired cache entry while others wait rather than all hitting the DB simultaneously.

**SRE**: Coordinating rolling deployments or auto-scaling decisions. You want exactly one automation script to be scaling out your fleet at a time, not three overlapping reactions to the same spike. A distributed lock with a short TTL (30–60s) and a fencing token prevents competing scripts from issuing conflicting resize commands.

## Common Pitfalls

- **Too-short TTL**: High lock churn under GC pressure; the lock lapses mid-operation.
- **Too-long TTL**: Slow recovery when the holder crashes.
- **Missing fencing tokens**: Creates only the *illusion* of mutual exclusion under failure.
- **Redlock skepticism**: Martin Kleppmann's critique is worth reading—Redlock's safety properties are weaker than etcd/Zookeeper-backed locks under certain failure modes.

When you need true mutual exclusion across nodes, reach for a consensus-backed system and always implement fencing on the resource side.
