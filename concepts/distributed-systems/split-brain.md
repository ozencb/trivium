---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Split-Brain** occurs when a network partition causes two or more node groups to each believe they are the authoritative cluster, leading them to independently accept writes and diverge in state. It's the failure mode where "the network broke" becomes "the data broke."

## The Core Mechanism

Consensus algorithms prevent this under normal operation — a leader can only be elected with quorum agreement. But split-brain usually sneaks in through configuration errors or timing edge cases that bypass consensus guarantees.

The classic scenario: a primary receives a GC pause or is slow to respond. Replicas time out, elect a new primary, and start accepting writes. Meanwhile, the original primary comes back, doesn't know it was deposed, and also accepts writes. You now have two nodes that both believe they're authoritative, diverging in silence.

This is distinct from a simple partition. In a partition, nodes know they can't reach each other. In split-brain, they *think they can* — or they don't care that they can't.

## Mental Model

Think of it like two datacenter halves during a fiber cut. Both halves have enough replicas to form a quorum *within themselves* if your quorum size is set too loosely. Both halves elect leaders. Both accept writes for 20 minutes until the fiber is restored. Reconciliation is now your problem.

The danger isn't the partition itself — it's that both sides kept moving.

## Practical Scenarios

**Backend:** Elasticsearch "split-brain" was notorious pre-7.x. If `minimum_master_nodes` was misconfigured as `1` in a 3-node cluster, a partition could produce two clusters each thinking they were primary. Indexes would diverge, and rejoining would require manual intervention (often data loss). The fix — setting it to `(n/2)+1` — is exactly quorum enforcement.

Redis Sentinel has a similar footgun: if sentinels are partitioned from each other but each can still reach a different Redis instance, you can end up with two sentinels promoting two different primaries.

**SRE:** Split-brain is a primary concern when designing failover logic. Aggressive health check timeouts + automatic failover = higher split-brain risk. This is the tradeoff behind "fencing" (STONITH in cluster management) — you don't promote a new primary until you've guaranteed the old one is dead, not just unresponsive. The operational cost of being wrong is too high.

## The Connection to Quorum Reads

Quorum reads are the read-side mitigation. If writes require quorum acknowledgment and reads also require quorum acknowledgment, you can guarantee reading the most recent write even if some nodes are stale — because the read and write quorums must overlap by at least one node. Split-brain makes quorum reads *necessary*, not just a performance tradeoff.
