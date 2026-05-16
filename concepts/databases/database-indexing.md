---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Database Indexing

An index is a separate data structure that the database maintains alongside your table so it can locate rows without scanning every row. The tradeoff: faster reads, slower writes, more storage.

**The core mechanism**

You already know B-Trees, so this is direct: most indexes *are* B-Trees. When you create an index on `users.email`, the database builds a B-Tree where each leaf node contains the indexed value plus a pointer (row ID or primary key) back to the actual row. A query like `WHERE email = 'x@y.com'` traverses the tree in O(log n) instead of scanning O(n) rows.

The key insight is that the index is sorted. That's not incidental — it's the entire point. Sorting is what makes range queries (`WHERE created_at > '2025-01-01'`), prefix matches (`LIKE 'foo%'`), and `ORDER BY` optimizations possible without full scans.

**Composite indexes have a left-prefix rule**

An index on `(last_name, first_name)` can serve queries filtering on `last_name` alone, or on both columns — but not `first_name` alone. The index is sorted by `last_name` first, so without constraining that first column, the database can't use the sorted order to skip rows. This trips people up constantly when they wonder why their index "isn't being used."

**Covering indexes eliminate the table lookup**

If your query only needs columns that are all in the index, the database never touches the actual table — it reads everything from the index leaf nodes. A query like `SELECT email, created_at FROM users WHERE email = 'x@y.com'` on an index `(email, created_at)` never fetches the full row. This is called an index-only scan and is meaningfully faster for high-throughput read paths.

**Where this shows up**

*Backend:* The first sign you need an index is a slow query under load that's fast in dev. Explain/analyze the query plan — if you see a sequential scan on a large table, that's your index candidate. Watch for `N+1` patterns too; even with indexes, hitting the DB 500 times per request will hurt.

*Fullstack:* Pagination with `OFFSET` degrades because the DB still scans to the offset point. Keyset pagination (`WHERE id > last_seen_id`) fixes this, but only if `id` is indexed — which it usually is as a primary key.

*Data:* Indexes on timestamp columns matter enormously for time-series style queries. A partial index (`WHERE deleted_at IS NULL`) can be far smaller than a full index and serves the 99% case where you only query active records.

**The write cost is real**

Every index must be updated on insert, update, and delete. A table with eight indexes pays eight B-Tree update costs per write. Index selectively — not every column, only columns that appear in `WHERE`, `JOIN ON`, or `ORDER BY` clauses in frequent queries.
