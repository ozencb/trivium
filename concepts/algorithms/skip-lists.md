---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Skip Lists

A skip list is a sorted linked list augmented with multiple "express lane" layers that let you skip large portions during traversal, achieving O(log n) average search/insert/delete without any rebalancing. The key motivation over balanced trees is concurrent friendliness: structural changes are local, so readers can safely traverse while writers are mid-update.

### Core Mechanism

The base layer (level 0) is a standard sorted linked list containing every element. Each higher layer contains a random subset of the layer below — by convention, each element gets promoted to the next level with probability 0.5. The invariant: every higher level is a subset of every lower level.

**Search** starts at the top-left corner. At each node, you look right: if the next value is ≤ your target, advance. If it overshoots or the lane ends, drop one level and repeat. You converge on the target logarithmically because each level roughly halves the remaining candidates.

**Insert** runs a search first to find the correct position at every level, then inserts the node and randomly determines its "height" (how many levels it occupies) by flipping coins until tails. This randomness is what makes skip lists probabilistic — no worst-case guarantee, but expected O(log n).

**Delete** is just a search plus pointer unlinking at each level the node occupies.

### Mental Model

Think of intercity rail: express trains skip most stops, regional trains skip some, local trains stop everywhere. When traveling from city A to city Z, you take the fastest train that doesn't overshoot, then transfer to slower lines as you get close. Skip list levels are exactly this — you descend through "express" layers until you're at the right neighborhood.

Search for 42 in `[7, 14, 28, 42, 59, 73]` with three levels:
- Level 2: 28 → 59 (overshoot) → drop
- Level 1: 28 → 42 → found, drop to level 0
- Level 0: confirm and return

### Why It Matters for Backend Systems

The concurrency story is where skip lists earn their keep. In a red-black tree, an insert might trigger rotations that update parent/child pointers at multiple nodes — coordinating this safely across threads requires locking a subtree or complex CAS sequences. In a skip list, an insert only touches its own forward pointers and the predecessor nodes at each level. A reader traversing elsewhere in the list will never see an inconsistent state from a concurrent insert.

Redis's sorted sets are backed by a skip list for exactly this reason — they need O(log n) range queries (`ZRANGEBYSCORE`) and concurrent access under heavy load. MemSQL and some LSM-tree implementations use skip lists for their in-memory components for the same tradeoff: simpler concurrent implementation with equivalent asymptotic complexity to balanced trees.

The expected height is O(log n), giving O(log n) average performance. The worst case is O(n) — technically possible if every coin flip comes up heads — but the probability decays exponentially fast, making it a non-issue in practice.
