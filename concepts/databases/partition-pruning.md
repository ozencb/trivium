---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Partition Pruning

When you query a partitioned table, the optimizer can skip partitions entirely if your `WHERE` clause matches the partition key — so instead of scanning 36 monthly partitions of an `events` table, a query filtered to `WHERE created_at >= '2026-04-01' AND created_at < '2026-05-01'` touches exactly one.

### The mechanism

Partitioning is a physical layout decision: rows are routed to child tables (or segments) based on a column's value ranges, lists, or hashes. Partition pruning happens at plan time — before execution — when the optimizer compares your predicates against the partition metadata. It builds a reduced scan set and simply never opens the irrelevant partitions. No I/O, no index lookup, just elimination by definition.

The key word is *plan time*. The optimizer needs a *static* predicate it can evaluate without executing the query. This means `created_at < NOW()` is typically safe (NOW() is resolved before planning), but `created_at < get_current_cutoff()` calling a user-defined function often isn't — the optimizer can't see through it, so pruning silently fails and you get a full scan anyway.

### Concrete example

Postgres range-partitions `orders` by `order_date`, monthly. You run:

```sql
SELECT * FROM orders WHERE order_date = '2025-11-15' AND customer_id = 42;
```

`EXPLAIN` shows `Seq Scan on orders_2025_11` — one partition. Change it to a function call on the date column, like `WHERE DATE_TRUNC('month', order_date) = '2025-11-01'`, and pruning breaks: the optimizer can't infer which partition a transformed column lands in. Wrap the function around the column, not the literal, and you're fine.

### Where this matters in practice

**Backend:** Multi-tenant SaaS systems often partition by `tenant_id` or `created_at`. If your ORM or query builder wraps predicates in functions or casts the column instead of the literal, you're paying full-scan costs on every tenant's query. Profile with `EXPLAIN ANALYZE` — look for "Partitions removed" in the output; if that number is zero and it should be nonzero, your predicate is broken.

**Data/analytics:** Time-series tables (metrics, events, logs) partitioned by day or month rely entirely on pruning for acceptable query times. A pipeline that doesn't filter on the partition key — say, it joins on a derived column — turns a 3-partition query into a 1000-partition scan. This is also where implicit casts bite you: if `created_at` is `TIMESTAMPTZ` and your literal is a `DATE`, some databases add a cast that obscures the column from the planner.

### When to reach for it

Pruning is automatic once partitioning exists — but it's only reliable when you design queries around the partition key. Treat the partition key like a first-class filter contract: document it, lint for it in query review, and verify it with `EXPLAIN` rather than assuming it works.
