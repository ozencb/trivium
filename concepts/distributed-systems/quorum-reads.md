---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Quorum Reads

In a replicated system, a quorum read requires contacting a majority of replicas before returning a result — it's how you get consistent reads without locking the entire cluster or relying on a single authoritative node.

### The Core Mechanism

In a cluster of N replicas, define W (write quorum) and R (read quorum). The invariant that makes this work is:

**W + R > N**

This guarantees the read set and write set always overlap — at least one node that acknowledged the write will be in your read set. A common configuration for N=3 is W=2, R=2.

Concretely: a write goes to nodes A and B. A read contacts B and C. B is in both sets — it has the latest value. Node C might be stale, but it doesn't matter because you're picking the highest-versioned response from your R nodes.

If you drop to R=1, you might exclusively hit C, which hasn't received the write yet. That's eventual consistency — fine for many use cases, but you've traded the overlap guarantee.

### Practical Scenarios

**Backend**: Cassandra exposes this directly as consistency levels per query. `QUORUM` means ⌊N/2⌋ + 1 replicas must respond. For anything where stale reads cause real harm — inventory counts, financial balances, auth tokens — you use `QUORUM` reads paired with `QUORUM` writes. The cost is tail latency: you're waiting on the slowest node in your quorum. For high-read workloads where a short staleness window is acceptable (feeds, recommendations), you drop to `ONE` or `LOCAL_ONE` and trade consistency for throughput.

**SRE**: Quorum reads fail *loudly* during partial outages — this is a feature, not a bug. If 2 of 3 replicas are unreachable, reads return errors rather than silently returning stale data. That's the CP side of the CAP tradeoff in practice. During incidents, this means quorum reads will degrade before eventually-consistent reads would. Your runbooks and SLOs need to account for this: replica health directly gates read availability, not just write availability. Monitoring replica lag becomes a leading indicator for read errors, not just write latency.

### One Subtlety Worth Knowing

Quorum reads protect you against missing a write, but not against write conflicts resolved incorrectly. If your system uses last-write-wins with wall-clock timestamps, two concurrent writes within clock skew can produce the "wrong" winner even with quorum reads. Systems handle this differently: Cassandra uses client-supplied timestamps (so you inherit the problem), DynamoDB uses conditional writes and versioning, Spanner uses TrueTime to bound uncertainty. The quorum mechanism is sound; the conflict resolution layer is where things get subtle.
