---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Partial Indexes

A partial index is an index with a `WHERE` clause baked into its definition — it only indexes rows that satisfy a predicate. The payoff is proportional to how selective that predicate is: if 2% of your rows are `status = 'pending'`, your index is 50x smaller than a full index on `status`, which means faster scans, smaller memory footprint, and cheaper writes.

### The core mechanism

When PostgreSQL (or another engine supporting partial indexes) builds a B-tree or hash index, it normally walks every row in the table. With a partial index, rows that don't match the predicate are simply skipped — they don't appear in the index at all. The planner will use the index only when a query's `WHERE` clause is logically compatible with the index predicate. If the index was created with `WHERE status = 'pending'`, a query filtering `WHERE status = 'pending'` can use it; a query filtering `WHERE status = 'completed'` cannot, and falls back to a seq scan or a different index.

### Concrete example

```sql
-- Without partial index: indexes every order ever created
CREATE INDEX idx_orders_user ON orders(user_id);

-- With partial index: only unshipped orders (say, 1% of the table)
CREATE INDEX idx_orders_user_active ON orders(user_id)
WHERE shipped_at IS NULL;
```

A query like `SELECT * FROM orders WHERE user_id = 42 AND shipped_at IS NULL` now hits a tiny index instead of scanning millions of historical rows. Write amplification also drops — inserting a completed order doesn't touch this index at all.

### Where this actually matters

**Backend services:** Soft-delete patterns are the canonical case. If `deleted_at IS NULL` is on 95% of rows but nearly every query filters on it, a full index on `deleted_at` is wasteful. A partial index keyed on the actual lookup columns with `WHERE deleted_at IS NULL` serves your read path while staying tiny.

**Job queues:** Indexing `WHERE status IN ('queued', 'retrying')` covers the hot path (workers polling for work) without storing index entries for the millions of completed jobs accumulating forever.

**Data pipelines / analytics:** Partial indexes shine when you have a hot "current" partition concept without actual table partitioning — indexing `WHERE created_at > '2026-01-01'` on a large events table to serve dashboard queries on recent data.

### Common pitfalls

- **Predicate mismatch:** The planner is conservative. If your query uses `WHERE status != 'completed'` but the index was defined with `WHERE status = 'pending'`, the planner won't use it even if they're semantically equivalent. Predicates must match structurally.
- **Over-indexing specific queries:** A partial index on a condition that changes frequently (e.g., a feature flag column) can create write hotspots — every status flip is an index update.
- **Forgetting to measure:** A partial index on a high-cardinality column with a selective predicate is a great trade. On an already-selective full index, the gain shrinks. Profile first.

Reach for partial indexes when you notice that a standard index is large but queries only ever touch a well-defined subset of it.
