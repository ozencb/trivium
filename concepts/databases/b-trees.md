---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## B-Trees

Most tree structures—like binary search trees—assume random access to individual nodes is cheap. Databases can't make that assumption. Fetching a node from disk costs orders of magnitude more than fetching it from RAM, and you pay per *block read*, not per byte. B-Trees are designed around this reality: they pack many keys into a single node so each disk read pulls in as much useful data as possible.

**The core mechanism**

A B-Tree of order `t` enforces these invariants at every node:
- Each node holds between `t-1` and `2t-1` keys (except the root, which needs at least 1).
- All leaves are at the same depth.
- Keys within a node are sorted; child pointers between keys route searches to the correct subtree.

That last invariant is the key insight. Unlike a binary tree where each node has 2 children, a B-Tree node might have hundreds. The tree stays extremely shallow—a B-Tree storing a billion entries with `t=500` is only about 4 levels deep. That means at most 4 disk reads to find anything.

When you insert a key and a node overflows past `2t-1` keys, it *splits*: the median key gets promoted to the parent, and the node divides into two valid nodes. This split propagates upward only if the parent also overflows—which rarely cascades far. Deletion is the mirror image: if a node falls below `t-1` keys, it borrows from a sibling or merges with one.

**Mental model**

Think of a phone book. The outer cover tells you letters A-Z; opening to "M" gives you sub-ranges; drilling down a few more levels lands you on the exact name. You never read every page—you read a few "summary" pages that route you to the answer. B-Tree nodes are those summary pages, each one fitting neatly on a single disk block.

**Where this matters in practice**

*Backend engineers* hit B-Trees through database indexes. When Postgres creates an index on `users.email`, it's building a B-Tree. That's why `WHERE email = 'x'` is O(log n) and doesn't require a full table scan—the index tree routes you to the row's location in a handful of reads.

*Data engineers* encounter them in storage engines like InnoDB and RocksDB (which uses a variant, LSM-trees). Knowing that B-Tree writes require node splits—and that a heavily write-loaded index can cause page fragmentation—explains why bulk-loading data with indexes disabled and then building the index afterward is dramatically faster.

The self-balancing property isn't magic: it's the split/merge rules maintaining depth invariants on every write. That discipline is what gives B-Trees their predictable O(log n) guarantees across read-heavy and write-heavy workloads alike.
