---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Vector Clocks

Vector clocks give you a way to track *causality* across distributed nodes — specifically, whether one event happened-before another, or whether two events are genuinely concurrent — without relying on synchronized wall clocks, which you can't trust.

### The core mechanism

Each node maintains a vector: an array of counters, one slot per node in the system. Rules:

- **On local event**: increment your own counter.
- **On send**: attach your current vector to the message.
- **On receive**: take the element-wise maximum of your vector and the incoming vector, then increment your own counter.

That's it. After any event, your vector encodes a summary of what your node "knows about."

To compare two vectors `A` and `B`:
- `A` happened-before `B` if every element of `A ≤ B` and at least one is strictly less.
- `A` and `B` are **concurrent** if neither dominates — some elements of `A` are greater, some of `B` are greater.

### Concrete example

Three nodes: `N1`, `N2`, `N3`. All start at `[0, 0, 0]`.

- `N1` writes: `N1 = [1, 0, 0]`, sends to `N2`.
- `N2` receives, merges: `N2 = [1, 1, 0]`, then writes independently.
- `N3` writes without receiving anything: `N3 = [0, 0, 1]`.

Now `N2`'s state (`[1, 1, 0]`) happened-after `N1`'s (`[1, 0, 0]`) — causally descended. But `N3`'s write (`[0, 0, 1]`) is **concurrent** with both: it has no knowledge of `N1` or `N2`'s events. That's not a clock drift problem — it's a genuine divergence that needs a resolution strategy.

### Where this shows up in practice

**Backend**: Riak and DynamoDB-style systems use vector clocks to detect whether two replicas diverged. When a client reads a key, they get back the vector clock alongside the value. If they write it back, the store can check: is this update causally descended from what the replicas have? If yes, safe to accept. If two replicas show concurrent writes, surface the conflict to the application rather than silently overwriting.

**Data**: In event-sourced systems, vector clocks let you reconstruct partial ordering across partitions. If you're replaying events from multiple streams (say, two microservices that both write to a shared read model), you can tell which events could have influenced which — vs. which genuinely raced. This matters when your conflict resolution isn't "last write wins" but something domain-specific, like merging two shopping carts.

The key insight is that vector clocks don't *resolve* conflicts — they *detect* them precisely. Once you know two writes are concurrent (not causally ordered), you hand the problem to application logic or a CRDT. That's what makes them foundational to conflict resolution.
