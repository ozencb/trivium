---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Index selection** is how the query planner decides *which* index to use when multiple candidates exist — or whether to skip indexes entirely and scan the table. Getting this wrong is one of the most common reasons a query runs 100x slower than it should.

## The Core Mechanism

The optimizer doesn't just check "does an index exist for this column?" It estimates the *cost* of each access path — index scan vs. table scan vs. multiple index merges — using statistics it maintains about column distributions, row counts, and cardinality. The winner is whichever plan has the lowest estimated I/O and CPU cost.

Two properties drive almost all selection decisions:

**Selectivity**: What fraction of rows match the predicate? An index on `country` where 60% of rows are `'US'` is nearly useless — scanning the heap for that many rows costs more than just reading it sequentially. The optimizer will often skip that index. An index on `user_id` in an orders table? Extremely selective, almost always used.

**Index prefix rules**: A composite index on `(a, b, c)` can satisfy queries filtering on `a`, `(a, b)`, or `(a, b, c)` — but not queries filtering only on `b` or `c`. The leftmost prefix must be present. This is why column order in composite indexes matters enormously.

## Concrete Example

You have an index on `(status, created_at)` and run:

```sql
SELECT * FROM orders WHERE created_at > '2024-01-01';
```

The optimizer may ignore this index entirely because `created_at` isn't the leading column. Flip the query to also filter on `status`, or create a separate index on `created_at`, and the plan changes.

## Why Indexes Get Ignored

Even with a perfect index, the planner skips it when:
- **Low cardinality predicate** — `WHERE active = true` on a table that's 90% active rows
- **Function wrapping** — `WHERE LOWER(email) = 'x'` defeats an index on `email`; use a functional index or store normalized data
- **Stale statistics** — after a bulk load, run `ANALYZE` (Postgres) or `UPDATE STATISTICS` (SQL Server) or the planner works with wrong estimates
- **Type mismatch** — passing a string to an integer column causes implicit casting, breaking index use

## Practical Scenarios

**Backend**: When a new endpoint is slow, run `EXPLAIN ANALYZE`. If you see a `Seq Scan` where you expected an index scan, check selectivity and whether your WHERE clause matches the index prefix. Adding a composite index that covers both the filter and the sort column often eliminates both the index scan and the sort step.

**Data**: In analytical queries with large fact tables, index selection matters less (full scans are often intentional), but partial indexes — e.g., `WHERE status = 'pending'` — can dramatically accelerate operational queries against append-heavy tables without bloating the full index.

The mental model: the optimizer is a cost accountant. Give it accurate statistics and indexes that match your query patterns, and it makes good choices. Obscure the data with functions or give it stale stats, and it flies blind.
