---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Split-Brain

When a network partition isolates two node groups that each independently believe they are the authoritative cluster, and both accept writes, you end up with divergent state that cannot be automatically reconciled — you need human judgment to determine which history is canonical, often after already serving inconsistent data to clients.

### The Mechanism

The invariant every consistent distributed system tries to maintain is: **at most one leader at any time**. Consensus algorithms like Raft enforce this through quorum — a write only commits if a majority (N/2 + 1) of nodes acknowledge it. A 5-node cluster partitioned 2+3 means only the 3-node side can form quorum; the minority side goes read-only. No split-brain.

The failure mode isn't a flaw in the algorithm — it's what happens when that invariant is violated, either by misconfiguration, a bug in the fencing mechanism, or an operator forcing a failover while the old leader is still running.

### Concrete Example

5-node Postgres with Patroni using etcd for coordination. Network partition creates {primary + 1 replica} vs {3 replicas}. The 3-node side elects a new primary through etcd quorum and starts accepting writes. The old primary loses etcd connectivity but is still reachable by some clients — if it doesn't step down (STONITH failed, or wasn't configured), it also continues accepting writes. Partition heals. You now have two divergent WAL histories. Which writes win? Which clients got stale or conflicting reads? There's no automatic answer.

The reason recovery is hard: unlike a node crash (replay from log, monotonic history), split-brain means two valid-looking but incompatible histories, both potentially externally visible.

### Practical Scenarios

**Backend:** Distributed locks are a common trap. If your lock service (Redis, ZK, etcd) partitions and two processes both successfully acquire the same lock, any "exactly once" guarantee you were relying on is broken — background job deduplication, payment processing, inventory updates. Fencing tokens (monotonically increasing lock version that downstream systems validate) are the standard defense here.

**SRE:** Runbooks for leader failover should never just say "promote replica." They must include verification that the old primary is fenced — either confirmed down, demoted, or unreachable from the new leader's perspective. Automated failover without fencing is a split-brain generator. This is why STONITH ("Shoot The Other Node In The Head") exists as a concept: when in doubt, kill the node you can't confirm is stopped.

### The Real Danger

Split-brain is insidious because the system *appears healthy* on both sides of the partition. Metrics look fine, writes succeed, no errors. The damage is invisible until the partition heals — and by then you've served inconsistent state. Understanding this is foundational to quorum reads: you read from a majority specifically to avoid silently reading from the minority side of a past or present split.
