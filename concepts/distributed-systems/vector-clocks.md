---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Vector Clocks

Eventual consistency tells you *that* replicas will converge — vector clocks give you the machinery to reason about *which* writes are causally related and which ones genuinely conflict. Without them, you can't distinguish "B happened after A" from "B and A happened independently and we need a human decision."

**The mechanism**

Each node maintains a vector of counters, one slot per node in the system. The rules are simple but their implications are deep:

1. On any local event or outgoing message: increment your own slot.
2. On receiving a message: take the element-wise maximum of your vector and the sender's, then increment your own slot.
3. To compare two events: VC(a) < VC(b) if *every* element of a ≤ every element of b (with at least one strictly less). If neither vector dominates, the events are **concurrent**.

The concurrent case is the point. Lamport timestamps (scalar clocks) give you a total order, but they lie — they'll tell you one event preceded another even when they're causally unrelated. Vector clocks trade that false precision for an honest partial order: "happened-before" is only asserted when you can prove it through message chains.

**Concrete example**

Three nodes: A, B, C. Vectors shown as `[A, B, C]`.

- A writes key `X` → A's clock: `[1, 0, 0]`, sends to B.
- B receives, merges to `[1, 1, 0]`, writes key `X` → `[1, 1, 0]`.
- Meanwhile, C independently writes key `X` → `[0, 0, 1]`.

Now compare B's write `[1, 1, 0]` and C's write `[0, 0, 1]`. Neither dominates — B has higher A and B slots, C has a higher C slot. These are concurrent. Your system now *knows* it has a conflict requiring resolution, rather than silently picking a "winner" by timestamp and discarding valid data.

**Where this surfaces in practice**

*Backend systems:* DynamoDB's original design used vector clocks on items to track concurrent writes across replicas. When the client reads an item, it gets the vector clock back; when it writes, it sends that clock as a condition. If two clients wrote without seeing each other's version, DynamoDB surfaces both siblings and delegates resolution to the application. Riak made this even more explicit, exposing vector clock conflicts as first-class objects.

*Data systems:* CouchDB uses a similar scheme to determine whether a document revision supersedes another or branches into a conflict tree. Understanding vector clocks is what separates "we'll just use last-write-wins" (which silently drops data) from a principled conflict resolution strategy.

**Why this matters in design discussions**

The invariant worth internalizing: vector clocks don't prevent conflicts, they *surface* them faithfully. Senior engineers reach for them when correctness under network partition is non-negotiable — when losing a write is worse than the complexity of resolving a conflict. Knowing this tradeoff is what lets you push back on naive LWW designs in review.
