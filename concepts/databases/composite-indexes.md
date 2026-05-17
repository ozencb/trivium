---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Composite Indexes

A composite index indexes multiple columns together, and the order you define them in is the entire game. The database can only traverse the index from the leftmost column forward — skip a column and you've lost the ability to seek efficiently.

**The core mechanism**

Think of a composite index on `(user_id, status, created_at)` as a sorted structure where rows are first grouped by `user_id`, then within each user group sorted by `status`, then within each status sorted by `created_at`. The database can binary-search into any prefix of this hierarchy, but not into an arbitrary middle layer.

This is the leftmost prefix rule: an index on `(A, B, C)` serves queries filtering on `A`, `A + B`, or `A + B + C`. A query filtering only on `B` gets no index seek — it has to scan.

**Equality before range**

The subtler rule is that equality predicates should come before range predicates in the column order. Given `WHERE user_id = 42 AND created_at > '2024-01-01'`, an index `(user_id, created_at)` works well: the database seeks to the exact `user_id` bucket, then range-scans `created_at` within it. Flip the order to `(created_at, user_id)` and the range on `created_at` eats the ability to narrow on `user_id` — you get a partial index scan at best.

**Concrete example**

```sql
-- Index: (tenant_id, status, created_at)

-- Uses all three columns — fast seek + range scan
SELECT * FROM jobs WHERE tenant_id = 7 AND status = 'queued' ORDER BY created_at;

-- Uses only the first two — still good for filtering, no sort benefit
SELECT * FROM jobs WHERE tenant_id = 7 AND status = 'failed';

-- Full scan — skipped leftmost column
SELECT * FROM jobs WHERE status = 'queued';
```

**Backend patterns**

Multi-tenant APIs almost always need `(tenant_id, ...)` as the prefix since every query is scoped to a tenant. Pagination endpoints benefit from `(tenant_id, created_at)` or `(tenant_id, id)` — the sort column at the end enables efficient cursor-based pagination without a filesort.

**Data engineering patterns**

In analytical workloads, composite indexes matter most for dashboards with fixed filter dimensions and variable time ranges: `(org_id, event_type, occurred_at)` serves a query like "all checkout failures for org 12 in the last 30 days" with a targeted seek. The key risk here is index proliferation — data teams sometimes create an index per dashboard query, each adding write overhead to every insert in a high-throughput events table.

**The pitfall to avoid**

An index that no query hits on its leftmost prefix is pure overhead. Every write maintains it; no read benefits. Before creating a composite index, verify that your actual query patterns use the leading columns. `EXPLAIN` output will show `Index Scan` vs `Seq Scan` and whether conditions become filter steps (not seeks) after a range predicate breaks the prefix chain.
