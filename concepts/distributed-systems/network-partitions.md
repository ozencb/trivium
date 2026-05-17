---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Network Partitions

A network partition occurs when a distributed system splits into isolated groups of nodes that can no longer exchange messages — not because nodes crashed, but because the communication path between them failed. This is distinct from a node failure: the nodes are alive and processing, they just can't coordinate.

**The core mechanism**

In any distributed system, nodes rely on message passing to agree on shared state. A partition severs those message paths — think a severed cable between two data centers, a misconfigured firewall rule, or a router dropping packets for a subset of hosts. From each side's perspective, the other side looks down. But both sides are still running, still accepting requests, still making decisions — independently.

This is what makes partitions dangerous compared to clean failures. A crashed node stops participating. A partitioned node *keeps participating*, just with stale or divergent state.

**Mental model**

Imagine two database replicas, A and B, normally syncing writes. A network switch dies between them. A client writes to replica A. Another client writes to replica B. Both writes succeed locally. When the partition heals, you have two divergent histories — the system has to decide which one wins, or merge them, or surface a conflict. There's no free lunch.

The CAP theorem formalizes exactly this tradeoff: under partition, a system must choose whether to stay consistent (reject requests rather than risk divergence) or stay available (serve requests and risk divergence).

**Practical implications**

*Backend:* If you're running a distributed database like Cassandra or Postgres with replicas, partitions determine your quorum logic. A write with `QUORUM` consistency will fail during a partition if it can't reach enough replicas — by design. You chose consistency over availability at configuration time. Understanding partitions means you understand *why* those knobs exist.

*SRE:* Network partitions are a recurring cause of split-brain scenarios — where two nodes each believe they're the primary and start accepting writes independently. This is especially common in leader-election systems (etcd, ZooKeeper, Raft clusters). Your runbooks should distinguish "node down" from "node partitioned" because the mitigation differs: a down node needs recovery; a partitioned node that *thinks it's still the leader* may need to be fenced before the partition heals to prevent data corruption.

**The invariant worth internalizing**

Partitions are not edge cases — they're a fundamental property of networks over commodity hardware. Any system that assumes reliable message delivery will behave incorrectly under partition. Designing for partitions means explicitly choosing what the system sacrifices (consistency vs. availability) and encoding that choice in your failure handling, not hoping the network stays up.
