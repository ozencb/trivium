---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Query Optimization

The query planner is the layer between your SQL and the data — it decides *how* to execute what you asked for, and that decision can mean the difference between a 2ms and a 45-second query. Understanding this separates engineers who can debug slow queries from those who can avoid them.

**The Core Mechanism**

When you submit a query, the planner doesn't execute it directly. It generates multiple candidate execution plans (different join orders, different index choices, sequential vs. index scans), estimates the cost of each using *statistics* it maintains about your data, then picks the cheapest.

Those statistics are the key: the planner stores histograms, distinct-value counts, and null fractions for each column — collectively called *cardinality estimates*. It uses these to answer questions like "how many rows will survive this WHERE clause?" and "which table should be the outer loop in this join?" A bad estimate cascades: if the planner thinks a filter returns 100 rows but it actually returns 100,000, it might choose a nested-loop join that becomes catastrophically slow at scale.

**Mental Model**

Think of it as a compiler optimization pass, but for data access. Just as a compiler chooses between loop unrolling, branch prediction hints, and register allocation based on profiling data, the query planner chooses between hash joins, merge joins, index seeks, and parallel scans based on statistics. It can't read your mind about data distribution — it can only see what `ANALYZE` (or auto-analyze) has sampled.

**Where This Bites You in Practice**

*Backend:* You add an index, query stays slow. The planner has stale statistics and thinks a sequential scan is cheaper. `EXPLAIN ANALYZE` shows the estimated rows vs. actual rows diverging by orders of magnitude — that's your tell. Running `ANALYZE` or forcing a stats update fixes it.

*Fullstack:* Queries that are fast in dev become slow in prod. Dev has 500 rows; prod has 50 million. The cardinality estimates that made an index scan "expensive" in dev now make a seq scan catastrophic in prod. Always test query plans against production-scale data.

*Data:* Multi-table analytical joins with skewed distributions — the planner picks a join order based on average cardinality, but your filter on `user_type = 'enterprise'` hits 2% of rows, not 50%. Providing better statistics (partial indexes, extended statistics in Postgres 10+) or explicit join hints can recover this.

**Why It Matters in Interviews and Design**

Senior engineers who understand this can have a specific conversation: "this query will likely force a hash join at scale because the cardinality on this column is high — we should composite-index here to make a merge join viable." That precision — tying index design to execution plan behavior — is what distinguishes a design discussion from guesswork.
