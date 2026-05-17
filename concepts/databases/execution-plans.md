---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Query Execution Plans

A query execution plan is the database engine's step-by-step blueprint for how it will retrieve your data — the specific sequence of scans, joins, and sorts it selected after evaluating alternatives. Reading plans is the difference between guessing why a query is slow and actually knowing.

### How it works under the hood

The planner is a cost-based optimizer. It doesn't look at your data directly — it looks at *statistics*: estimated row counts per table, column cardinality, data distribution histograms. From these, it estimates the cost of different execution strategies and picks the cheapest one.

That distinction matters: the planner is reasoning about a *model* of your data, not the data itself. When that model is wrong — stale stats, unusual distributions, skewed values — the planner makes bad decisions, and that's where most hard-to-diagnose performance problems originate.

### The core failure mode: cardinality estimation

Consider this query:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
WHERE u.country = 'US';
```

The plan might show:
```
Hash Join (rows estimated=48000, actual=14)
  -> Seq Scan on users (filter: country='US')
  -> Hash on orders
```

The planner thought the country filter would return 48k users, so it built a hash table over orders — expensive upfront, efficient at scale. But only 14 rows matched. A nested loop with an index scan on orders would have finished in milliseconds. This is a cardinality estimation failure caused by stale statistics or a data distribution the planner didn't account for.

The fix might be `ANALYZE users`, or a partial index, or a query rewrite that materializes the filtered set first.

### Backend: production query regressions

When a query that worked fine for months suddenly times out, check the plan before touching indexes. The most common cause is that data volume crossed a threshold where the planner switched strategies — from index scan to sequential scan — because it now estimates the index isn't worth it. Running `EXPLAIN ANALYZE` before and after the regression usually shows exactly where the plan diverged.

### Data: multi-table analytical joins

In OLAP workloads, join order dominates performance. The planner sequences joins based on estimated intermediate row counts — filter aggressively early, join less data later. When it gets cardinality wrong, it might join two 10M-row tables before applying a filter that would have reduced one to 200 rows. Explicit `JOIN` ordering hints, CTEs that force materialization, or statistics targets on skewed columns are the levers here.

### Why this matters in interviews and design discussions

Most engineers know to "add an index." Senior engineers know to pull the plan, identify whether the bottleneck is a bad scan type, a wrong join strategy, or a cardinality misestimate — and propose the right fix for that specific cause. That precision is what separates architectural intuition from cargo-culting.
