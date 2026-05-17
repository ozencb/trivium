---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Covering Indexes

A covering index includes every column a query touches — WHERE predicates, SELECT list, ORDER BY, JOIN keys — so the database engine can answer the entire query from the index structure alone. The payoff: zero heap fetches, which eliminates the most expensive I/O in a typical index lookup.

### The core mechanism

A standard index lookup is two steps: traverse the B-tree to find matching row pointers, then follow each pointer back to the heap (the actual table storage) to read the full row. That second step — the heap fetch — involves random I/O per row. At scale, it dominates query cost.

A covering index short-circuits step two. All needed column values live in the index leaf nodes themselves, so after the B-tree traversal, you're done. In PostgreSQL this appears in `EXPLAIN` as `Index Only Scan`. In MySQL/InnoDB the optimizer calls it a covering index explicitly.

### Concrete example

```sql
-- Table: orders(id, user_id, status, created_at, total, shipping_notes, ...)

SELECT user_id, status, created_at
FROM orders
WHERE user_id = 123 AND status = 'pending';
```

A composite index on `(user_id, status)` handles the WHERE but still needs a heap fetch per row to retrieve `created_at`. Add `created_at` to the index and the heap fetch disappears:

```sql
CREATE INDEX idx_orders_cover ON orders(user_id, status, created_at);
```

If you only need `created_at` in the SELECT (not for filtering or ordering), PostgreSQL's `INCLUDE` clause is cleaner — it stores the column in leaf nodes without inflating the B-tree key, keeping the index more compact for writes:

```sql
CREATE INDEX idx_orders_cover ON orders(user_id, status) INCLUDE (created_at);
```

### When to reach for this

**Backend:** Any hot API endpoint that drives a list view — user's order history, notifications, feed items — typically selects 3–6 columns filtered by a user or tenant ID. These queries run constantly. A covering index here can drop P99 latency significantly without touching application code.

**Data/analytics:** Aggregation queries that don't need full rows. `SELECT status, COUNT(*) FROM orders WHERE user_id = 123 GROUP BY status` is fully satisfiable from a `(user_id, status)` index. No heap access at all.

### Common pitfalls

**Width creep.** Covering every query by adding columns to one index creates a fat index that's expensive on writes and chews through buffer cache. Be selective — cover the queries that are hot and slow.

**PostgreSQL's visibility map gotcha.** Index Only Scans can still hit heap pages if the visibility map indicates the page has unfrozen rows. Regular `VACUUM` keeps this from undermining the optimization.

**Don't cargo-cult it.** On small tables or low-traffic queries, a covering index adds write overhead for marginal read gain. Reach for it when `EXPLAIN ANALYZE` shows heap fetches are the actual bottleneck, not as a default strategy.
