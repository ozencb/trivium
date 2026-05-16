---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## B-Trees

A B-Tree is a self-balancing tree data structure that keeps data sorted and allows searches, insertions, and deletions in O(log n) time. Databases use them almost universally for indexes because they minimize disk I/O — the thing that actually kills query performance.

### The Core Mechanism

A B-Tree generalizes a binary search tree by allowing each node to have *many* keys and *many* children — not just two. Each node holds between `t-1` and `2t-1` keys (where `t` is the minimum degree), and non-leaf nodes have one more child than they have keys. Keys within a node are sorted, and the subtree between key[i] and key[i+1] holds all values in that range.

The critical invariant: **all leaf nodes sit at the same depth**. The tree grows upward (at the root) rather than downward. When a node fills up, it splits and pushes its median key up to the parent. This keeps the tree perfectly balanced without rotations.

### Mental Model

Think of a physical phone book organized as a tree. The root page might just say "A–M go left, N–Z go right." Each subsequent page narrows the range until you hit a leaf with actual records. Now imagine the phone book has 1 billion entries but each page can hold 1,000 entries. You'll find any name in at most 3–4 page turns. That's B-Trees: wide nodes, shallow trees, few disk reads.

In practice, a B-Tree with order 1000 and 1 billion entries needs only ~3 levels. A binary tree would need ~30. Each level is a disk read. The difference is enormous.

### Where You'll Actually See This

**Backend / databases:** When you run `EXPLAIN` on a slow query and see "Index Scan," that index is almost certainly a B-Tree (PostgreSQL, MySQL InnoDB, SQLite — all default to B-Tree indexes). Range queries like `WHERE age BETWEEN 25 AND 40` work efficiently because the sorted order in the tree maps directly to the range. Hash indexes would fall apart here.

**Data engineering:** When you're designing a table that gets hit with high-cardinality range scans — time-series data, audit logs, sorted IDs — a B-Tree index on the timestamp column lets the query engine skip straight to the relevant block without scanning. Understanding this tells you *why* random UUID primary keys hurt insert performance: every insert must find the right position in the tree, potentially causing page splits throughout.

**Filesystems:** ext4, NTFS, HFS+ all use B-Tree variants internally to store directory entries, which is why listing a directory with millions of files is still fast.

The practical insight: B-Trees are the reason "add an index" fixes queries. The structure trades write overhead (maintaining sorted order, handling splits) for dramatically cheaper reads — the right tradeoff for read-heavy workloads that dominate most databases.
