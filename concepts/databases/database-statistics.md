---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Database Statistics

The query planner is blind — it never looks at your actual data when choosing how to execute a query. Instead, it consults statistics: metadata collected by analyzing your tables that describes *what's in there* without storing the data itself. When those statistics are wrong, the planner makes bad bets, and bad bets at scale mean full table scans where index seeks should be, or nested loops where hash joins belong.

**The core mechanism**

Statistics are primarily two things: histograms and cardinality estimates.

A *histogram* divides a column's value range into buckets and records how many rows fall into each. For a `status` column with 95% `'active'` and 5% `'inactive'`, the histogram captures that skew. For a numeric `user_id`, it tracks the distribution across the range.

*Cardinality* is the count of distinct values in a column (and, critically, per-column-combination for multi-column stats). The planner uses this to estimate *selectivity* — what fraction of rows a predicate will return. `WHERE status = 'inactive'` should return ~5% of rows; the planner uses that estimate to decide whether an index is worth the random I/O overhead.

The cascade: estimated row count → join order → join algorithm → memory grants. One bad cardinality estimate at step one corrupts everything downstream.

**Mental model**

Imagine the planner as an analyst who studied a sample of your data six months ago and never looked again. It still thinks the table has 10k rows when you now have 100M. It still thinks `region = 'EU'` matches 20% of rows before you launched in Europe and that went to 60%. Every plan it builds is based on that stale snapshot.

**Where this bites you in practice**

*Backend services:* A query runs fine in development (small dataset, fresh stats) and degrades mysteriously in production after data volumes shift. The fix isn't always an index — sometimes it's `ANALYZE` (Postgres) or `UPDATE STATISTICS` (SQL Server) followed by checking the plan again. After large bulk loads or deletes, stats go stale fast; autovacuum/autostat daemons often can't keep up.

*Data pipelines:* ETL jobs that truncate-and-reload tables nuke the stats. The first query after a reload hits the planner with zero-row estimates (or cached stale ones), often triggering catastrophic join orders on the first production run of the day.

**What to actually do**

- Run `EXPLAIN (ANALYZE, BUFFERS)` in Postgres — the gap between *estimated* and *actual* rows in the output is your signal. A 10x divergence is a red flag.
- Force a stats refresh after large data changes; don't wait for autovacuum.
- In Postgres, increase `statistics target` (`ALTER COLUMN ... SET STATISTICS 500`) for high-cardinality or highly-skewed columns where the default 100-bucket histogram isn't granular enough.
- Create extended statistics (`CREATE STATISTICS`) for correlated columns — the planner assumes column independence by default, which is often catastrophically wrong.

Understanding this is the prerequisite for reading execution plans with any real depth.
