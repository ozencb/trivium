---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Query Optimization** is the process by which a database engine transforms your SQL into an efficient execution strategy — it's why two semantically identical queries can have wildly different performance characteristics.

## The Core Mechanism

When you submit a query, the database doesn't execute it literally. It hands it to the **query optimizer**, which generates multiple candidate execution plans, estimates the cost of each (in terms of I/O, CPU, and memory), and picks the cheapest one. This cost estimation relies on **statistics** the database maintains about your data: cardinality (how many distinct values a column has), row counts, data distribution histograms, and index availability.

The optimizer operates in two phases. First, **logical optimization** rewrites the query algebraically — pushing filters down closer to the data source, eliminating redundant subqueries, reordering joins. Second, **physical optimization** decides *how* to execute each operation: which index to use (or whether to scan), which join algorithm (nested loop, hash join, merge join), whether to sort before joining.

## A Concrete Mental Model

Think of it like a GPS with traffic data. The destination (your query result) is fixed, but there are dozens of routes. The optimizer is the GPS: it estimates travel time for each path using historical data (statistics), picks the fastest one, and gives you turn-by-turn instructions (the execution plan). If its map data is stale — like when statistics haven't been updated after a bulk insert — it'll route you into traffic.

Example: `SELECT * FROM orders WHERE user_id = 42 AND status = 'pending'`. If `user_id` is highly selective (one user out of millions) and `status` is not (maybe 40% of rows are pending), the optimizer should filter on `user_id` first. A bad statistics estimate can flip this decision, causing a full table scan.

## Practical Scenarios

**Backend:** You write a `JOIN` across three tables for a REST endpoint. Locally it's fine (10k rows), but in production (10M rows) it times out. The optimizer chose a nested-loop join because statistics were out of date. Running `ANALYZE` or `UPDATE STATISTICS` and adding a composite index often fixes this without touching application code.

**Fullstack:** Your search feature does `WHERE name LIKE '%smith%'`. The leading wildcard prevents index use entirely — the optimizer has no choice but to scan. Knowing this, you'd reach for a full-text index or an external search service instead of assuming an index will help.

**Data:** A reporting query with multiple aggregations and subqueries is slow. The optimizer may be materializing a subquery repeatedly. Rewriting with a CTE or window function gives the optimizer better rewrite opportunities and often changes the plan significantly.

## Why This Matters Now

Understanding optimization is what separates writing queries that *work* from writing queries that *scale*. Index Selection and Execution Plans are the two tools you use to inspect and influence the optimizer's decisions — execution plans show you what it actually chose, and index design is your primary lever to change it.
