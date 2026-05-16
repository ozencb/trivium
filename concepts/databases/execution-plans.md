---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Query execution plans** are the database engine's internal blueprint for *how* it will physically carry out a SQL query — which indexes to use, in what order to join tables, how to filter rows. Understanding them is how you move from "my query is slow" to "here's exactly why."

## How it works

SQL is declarative — you say *what* you want. The plan is imperative — it says *how* to get it. When you submit a query, the optimizer generates multiple candidate plans, estimates the cost of each using statistics (row counts, cardinality, data distribution histograms), and picks the cheapest. The plan is a tree of physical operators: `Index Scan`, `Hash Join`, `Sort`, `Nested Loop`, etc.

The optimizer can be wrong. Its estimates break down when statistics are stale, when data is skewed in ways it doesn't model, or when your query structure makes cost estimation hard (e.g., correlated subqueries, OR conditions across indexed columns).

## Concrete example

```sql
SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id WHERE c.country = 'DE';
```

The optimizer picks between roughly:
1. Full scan on `orders`, hash join to `customers`, filter by country
2. Index scan on `customers WHERE country = 'DE'`, nested loop into `orders`

Option 2 is obviously better if German customers are 1% of your data. But if the optimizer's statistics show `country` has low cardinality and assumes uniform distribution, it may pick option 1 — and your query scans 10M rows to return 5K.

`EXPLAIN ANALYZE` (Postgres) or `EXPLAIN FORMAT=JSON` (MySQL) gives you the actual plan with estimated vs. actual row counts. When those diverge wildly, that's the tell: stale stats or data skew. Running `ANALYZE` to refresh statistics often fixes it without touching the query.

## In practice

**Backend:** A query that's fast in staging turns slow in prod. Data volume is different, but also data *distribution* is different. Pull the plan against prod-scale data — you'll often find a `Seq Scan` where an `Index Scan` was expected, because the optimizer decided the index wasn't selective enough. Sometimes a partial index or a `WHERE` clause restructure is the fix, not a new index.

**Data:** ETL and analytical queries frequently blow up from join ordering. Three large tables joined in the wrong order can produce a massive intermediate result set before filters apply. Knowing how to read a plan lets you force ordering via CTEs (which Postgres materializes), `STRAIGHT_JOIN`, or optimizer hints — rather than cargo-culting indexes.

## Mental model

Treat the execution plan as the *compiled artifact* of your SQL. The SQL is source code; the plan is the binary. Profiling a slow query without inspecting the plan is like debugging performance without a profiler — you're guessing at the wrong level of abstraction.
