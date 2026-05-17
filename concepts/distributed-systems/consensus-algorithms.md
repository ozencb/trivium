---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Consensus algorithms are the mechanism by which distributed nodes agree on a single value even when some nodes crash or messages are lost.** Without them, replication is guesswork — two replicas might accept conflicting writes and diverge permanently.

## The Core Problem

Distributed consensus sounds simple: ask everyone, take the majority answer. The hard part is that "asking" is unreliable. A node that doesn't respond might be dead, or it might just be slow — you can't tell. And if you commit a value before you're sure a majority has it, a partition can leave you with two independent clusters that both believe they're authoritative.

## The Mechanism (Raft as the mental model)

Raft makes this concrete. The cluster elects a single **leader** via a term-numbered vote — each node votes for at most one candidate per term, and a candidate needs a majority to win. This alone prevents two simultaneous leaders in the same term.

The leader then drives **log replication**: it appends an entry locally, fans it out to followers, and waits for a **quorum** (majority) to acknowledge. Only after quorum acknowledgment does it commit — meaning even if the leader dies immediately after, enough nodes hold the entry that any future leader will inherit it.

The invariant: **a committed entry is always present on a majority, and any future leader must win a majority vote, so it must overlap with at least one node that has the committed entry.** That overlap is what preserves safety across failures.

## Practical Implications

**Backend:** When you use etcd or ZooKeeper for distributed locks, leader election, or feature flag consensus — Raft is running underneath. The key mental model: reads/writes go through the leader, which means higher latency than a local cache but linearizability guarantees. Don't use these for hot paths.

**SRE:** Quorum size is a reliability knob. A 3-node cluster tolerates 1 failure; 5-node tolerates 2. Stretching clusters across AZs gives you partition tolerance, but cross-AZ latency now sits on every write path. Raft can't help you if your network round-trips are 80ms — that's just physics.

**DevOps/Infrastructure:** Kubernetes uses etcd for all cluster state. This means etcd quorum loss = cluster brain death. If you're running k8s, your etcd backup story and node count are consensus questions, not ops hygiene questions.

## Common Pitfalls

- **Mistaking availability for consensus:** A 5-node cluster with 3 nodes in one AZ and 2 in another will lose quorum if the larger partition is isolated — even though 3 nodes are still running.
- **Underestimating leader bottleneck:** All writes serialize through the leader. Sharding is the escape hatch, not tuning Raft.
- **Confusing consensus with consistency:** Consensus gives you agreement on *ordering*; your application still defines what "correct" means for your data model.

Consensus is what separates "a bunch of nodes that share data" from "a reliable system." It's not cheap, but it's the only rigorous foundation for anything that needs to be both replicated and correct.
