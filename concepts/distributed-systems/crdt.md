---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CRDTs (Conflict-free Replicated Data Types)

CRDTs are data structures designed so that concurrent writes across replicas *always* merge correctly — no coordination, no conflict resolution, no last-write-wins coin flips. The payoff is availability without sacrificing correctness: every replica can accept writes independently and still converge to the same state.

**The core idea**

You already know eventual consistency is a promise ("replicas will agree *eventually*"), and vector clocks give you a way to reason about causality. CRDTs make the convergence *guaranteed by math* rather than by your merge logic being correct.

The trick is constraining your data structures so that the merge operation is:
- **Commutative**: `merge(A, B) = merge(B, A)` — order of receiving updates doesn't matter
- **Associative**: `merge(A, merge(B, C)) = merge(merge(A, B), C)` — grouping doesn't matter
- **Idempotent**: `merge(A, A) = A` — receiving the same update twice is safe

A simple counter that only increments (a G-Counter) is a CRDT. Each node tracks its own increment count. Merge is `max(nodeA, nodeB)` per node. You can never "undo" an increment, but that constraint is what makes convergence trivial. The moment you allow decrements naively, you break these properties — which is why PN-Counters (positive/negative) track two G-Counters internally.

**Mental model**

Think of a grow-only set (G-Set). `{a, b}` merged with `{b, c}` is always `{a, b, c}`. Doesn't matter which replica processed which write, doesn't matter what order the sync messages arrived. You could receive the merge message 10 times and the result is the same. This is trivially CRDT-shaped. Most real CRDTs are variations on this theme — constrained operations on richer structures.

**Where this matters in practice**

*Backend*: Distributed caches, session stores, feature flag rollout counters, shopping carts in high-availability e-commerce. Riak popularized CRDTs for exactly this use case. If you've used Redis cluster with optimistic concurrency, you've seen the *absence* of CRDTs — CRDTs remove the "detect and retry" loop entirely.

*Data*: Collaborative editing (Google Docs-style) is the canonical example. Text CRDTs like RGA or LSEQ let two users insert characters simultaneously and merge without a central lock. Figma's multiplayer uses a CRDT-adjacent approach. Distributed databases like Cassandra's counters and DynamoDB's conditional writes approximate CRDT semantics in specific cases.

**The honest tradeoff**

CRDTs work by limiting what operations are allowed — you often can't support arbitrary reads and writes. They also have memory overhead (tombstones for deletions, vector metadata). Reach for them when you need genuine multi-master writes with zero coordination cost and can accept the semantic constraints they impose. If your use case needs transactions or arbitrary mutation, a CRDT will fight you.
