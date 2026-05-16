---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Eventual Consistency

Eventual consistency is a replication model where writes are accepted immediately on one node and propagated to other replicas asynchronously — meaning all replicas will converge to the same value *given no new updates*, but reads may return stale data in the interim. It's the deliberate trade-off you make when you choose availability and partition tolerance (the AP side of CAP) over strong consistency.

### The Core Mechanism

When a write hits a node, it doesn't block waiting for all replicas to acknowledge it. The write succeeds locally, and replication happens out-of-band. This means two things: reads can return stale values, and two replicas can receive conflicting concurrent writes.

The hard part isn't the "eventually" — it's what happens when writes conflict. Systems need a resolution strategy: last-write-wins (using wall clocks, risky due to clock skew), vector clocks (track causal ordering across nodes), or CRDTs (data structures designed to merge deterministically). The choice of conflict resolution is where eventual consistency gets genuinely complex.

### Mental Model

Think of it like git. Each developer has a full local copy. They commit independently. Eventually, after pushing and pulling, everyone converges. Merge conflicts are the conflict resolution problem. You can work offline (high availability) but you might make decisions based on a stale branch.

The analogy breaks down in one key way: in distributed systems, you usually can't ask the user to resolve merge conflicts.

### Practical Scenarios

**Backend:** DynamoDB and Cassandra default to eventual consistency. A user's shopping cart, a "like" counter, a user profile — these tolerate stale reads. You choose strong consistency (paying latency + availability cost) only for things like inventory counts or payment state.

**SRE:** Replication lag is your eventual consistency health metric. If replica lag spikes, your "eventually" becomes "very slowly" — which breaks SLOs for anything read-sensitive. You'll also see this in cache invalidation: your Redis cache is an eventually consistent view of your DB; invalidation strategy is just your replication protocol.

**Fullstack:** The classic footgun is read-your-writes violations. User posts a comment, gets redirected, and hits a replica that hasn't synced yet — the comment appears missing. The fix is routing the user's reads to the same node they wrote to (sticky sessions or primary reads) for a short window after a write.

### Connection Forward

Eventual consistency makes conflict resolution a first-class concern — you can't avoid thinking about what happens when two nodes see conflicting writes. That's where vector clocks, CRDTs, and application-level merge logic come in. It also forces you to design UI and API semantics around the possibility of stale reads, which is where read-your-writes consistency (a weaker guarantee than strong, stronger than eventual) becomes a useful middle ground.
