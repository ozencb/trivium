---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**CAP Theorem** states that a distributed system can guarantee at most two of three properties: Consistency, Availability, and Partition Tolerance. The critical insight is that network partitions are not optional — they *will* happen — so the real choice is between consistency and availability when they do.

## The Core Mechanism

When a network partition occurs, nodes in your system can no longer communicate. At this point, you face a forced choice:

**Choose consistency:** Refuse to serve requests on the isolated side until the partition heals. Every read reflects the latest write, but some nodes return errors or block.

**Choose availability:** Keep serving requests on all nodes, but accept that nodes may diverge — reads may return stale data, writes may conflict.

There's no third option. If you insist on both, a partition makes the guarantee impossible to honor. This isn't an engineering problem you can solve with better hardware or smarter code — it's a fundamental impossibility result (proven by Gilbert and Lynch in 2002, building on Brewer's conjecture).

## Mental Model

Imagine two database replicas in different data centers, connected by a single network link. That link goes down.

- **CP behavior:** One replica stops accepting writes, returns `503 Service Unavailable`. The other keeps running. When the link recovers, they reconcile. Your data is never inconsistent, but requests fail during the partition.
- **AP behavior:** Both replicas keep accepting writes independently. When the link recovers, you have a merge conflict — two "latest" values for the same key. The system is always responsive, but you must resolve divergence.

## Practical Scenarios

**Backend:** When choosing a database, this is the design axis that matters most. Zookeeper and etcd are CP — they're used for coordination (leader election, distributed locks) where split-brain is catastrophic. Cassandra and DynamoDB are AP — they prioritize uptime and use eventual consistency with conflict resolution (last-write-wins, vector clocks) for use cases like shopping carts or user preferences where brief staleness is acceptable.

**SRE:** During an incident, understanding your system's CAP stance tells you what to expect. A CP system under network stress starts returning errors — your availability SLO takes the hit, but data integrity holds. An AP system under the same stress keeps returning `200` but may serve stale or conflicting data — users see inconsistency, but the service appears "up." Knowing which failure mode to expect shapes your runbook.

## Why This Matters Beyond Trivia

CAP is often misapplied as a simple taxonomy. The sharper understanding is: **partition tolerance isn't a property you choose, it's a constraint you accept**, and the theorem is really about what you sacrifice *during* partitions. PACELC extends this further — even without partitions, there's a latency/consistency tradeoff — which is where senior design conversations usually go next.
