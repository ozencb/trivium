---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Consensus algorithms solve a deceptively hard problem: how do N independent nodes agree on a single value when any of them can crash, stall, or lose messages — without a coordinator they all implicitly trust?

**The core problem**

You can't just do a majority vote naively. Imagine three nodes voting simultaneously: each sends its vote, waits for others, then commits. If node A crashes after committing but before the others receive its vote, B and C see two nodes and can't know whether A committed "yes" or nothing. They're stuck — moving forward risks inconsistency, waiting risks blocking forever. This is the fundamental tension consensus must resolve.

**How Raft (and Paxos family) approaches it**

Raft structures the problem around *leader election* and *log replication*. One node is elected leader per *term* (a logical clock). The leader receives all writes, appends them to its log, and replicates to followers. A write is only committed once a *quorum* (majority) acknowledges it. If the leader dies, a new election happens — but only a node with the most up-to-date log can win. This invariant means a newly elected leader always has all committed entries.

The key insight: you don't need all nodes to agree simultaneously. You need a majority to agree, and any two majorities share at least one node. That overlap node acts as the source of truth across elections.

**Mental model**

Think of it like a relay baton. The baton (committed log) must be in at least one hand in any majority group. When leadership transfers, the new leader finds someone holding the baton and reconstructs ground truth from there. No committed write is ever lost because it always lives in the overlap.

**Practical scenarios**

*Backend:* You're building a distributed rate limiter. Multiple app servers need to agree on a counter. Without consensus, concurrent increments race. With it (via etcd or ZooKeeper), one node serializes writes — you get linearizability without a single point of failure.

*SRE:* Your service discovery system (Consul, etcd) uses Raft internally. When you lose a minority of nodes, the cluster keeps serving. But lose a majority, and it stops accepting writes deliberately — this is by design, not a bug. Understanding this shapes your alerting: "lost quorum" is a different severity than "lost one node."

*DevOps:* Kubernetes control plane (etcd) requires a quorum to schedule pods. A 3-node etcd cluster tolerates 1 failure; a 5-node cluster tolerates 2. This directly informs your HA infrastructure decisions — running 2 etcd nodes is *worse* than 1 because you've added failure surface without gaining fault tolerance (quorum of 2 requires both).

**Why it matters for Split-Brain and Distributed Locks**

Split-brain happens when consensus breaks down — two partitions each believe they have quorum. Distributed locks depend on consensus to ensure mutual exclusion survives node failures. Both problems are essentially "what happens when consensus isn't working correctly."
