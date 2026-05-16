---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Conflict Resolution** is how distributed systems decide which version of data "wins" when concurrent writes produce divergent state across nodes — the mechanism that keeps eventual consistency from just being eventual chaos.

## The Core Mechanism

In any system where multiple nodes can accept writes independently (for availability or latency), you will inevitably get two clients writing to the same key at the same time on different replicas. When those replicas sync, they have two different values. The system must resolve this — and the naive answer ("last write wins") is worse than it sounds.

The core insight is that "conflict resolution" is really a question about **what information you preserve** when merging divergent histories:

- **Last-Write-Wins (LWW):** Use wall-clock or logical timestamps; higher timestamp survives. Simple, lossy. Works when losing a write is acceptable (caches, metrics).
- **Multi-Version Concurrency (MVCC):** Keep all versions with vector clocks to track causality. If B happened after A, B wins. If they're truly concurrent, expose the conflict — let the application merge.
- **CRDTs (Conflict-free Replicated Data Types):** Design the data structure so all concurrent operations are mathematically guaranteed to merge without conflict. A set where you can only add, a counter you can only increment. The merge is the semantics.

## Mental Model

Think of Google Docs. Two people edit the same paragraph simultaneously — the doc doesn't pick one and discard the other. It merges the changes because character insertions commute (order doesn't matter for the end result). That's a CRDT. Now imagine two people simultaneously set the document title — one title has to lose. That's LWW, and it's fine there because the intent was to set, not accumulate.

## Practical Scenarios

**Backend:** Designing a shopping cart in DynamoDB or Cassandra? If you model it as a single `cart` blob with LWW, a user adding two items from different tabs may silently lose one. Model it as a set (add/remove operations) or maintain a server-side merge function. Dynamo explicitly surfaces conflicts as siblings and forces your application to resolve them.

**SRE:** During a network partition, your distributed config store (etcd, Consul) may enter a split-brain window. After healing, whichever replication strategy your system uses determines whether config drift silently discards writes. Understanding whether your store uses Raft (strong consistency, no conflict by design) vs. a gossip-based eventually consistent system (conflicts possible) is the difference between "the partition was safe" and "we need to audit what changed."

## The Thing People Miss

Conflict resolution isn't just a database concern — it's a modeling decision. The right answer is often to **change what you store** so conflicts become impossible or trivially mergeable, rather than bolting on merge logic after the fact. CRDTs are an extreme example of this, but even simple choices like using append-only event logs instead of mutable state sidestep most conflicts entirely.
