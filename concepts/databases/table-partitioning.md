---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Table Partitioning

A large table that's outgrown indexes is one of the most common scaling dead-ends in production databases. Partitioning is the answer: you split the table into smaller physical segments while keeping a single logical table visible to queries.

### The Core Mechanism

The database engine routes each row to exactly one partition based on a partitioning key. Three strategies:

- **Range**: rows go to the partition whose range contains the key value. A `created_at` column partitioned monthly means Jan rows land in one file, Feb in another.
- **List**: explicit discrete values mapped to partitions — e.g., `region IN ('us-east', 'eu-west')`.
- **Hash**: the key is hashed modulo N, distributing rows evenly when no natural range exists.

The critical payoff is **partition elimination**: when a query's WHERE clause references the partition key, the planner skips partitions that can't possibly contain matching rows. On a 5-year events table partitioned by month, a query for last week touches 1 partition instead of 60. This beats even a B-tree index when you're doing large sequential reads — the planner avoids the index entirely and just reads the one physical segment.

### Concrete Mental Model

Think of it like filing cabinets. One massive cabinet with millions of papers is painful to search even with an index. Sixty monthly cabinets means you throw out 59 without opening them. You can also physically remove the January 2020 cabinet without a `DELETE` — just `DROP PARTITION`, which is near-instant and doesn't bloat the WAL.

### Practical Scenarios

**Backend**: Time-series tables (audit logs, events, messages) are the canonical case. Partition by month or week. Queries over recent data are fast; old partitions get archived or dropped on a schedule without expensive bulk deletes.

**Data/Analytics**: Fact tables in a data warehouse partitioned by date plus sub-partitioned by region let your query engine (Postgres, BigQuery, Snowflake) skip irrelevant partitions before even touching storage. This is often the difference between a 30-second query and a 3-second one.

**SRE**: Partition pruning makes your retention story operational rather than a quarterly fire drill. Drop old partitions instead of running `DELETE WHERE created_at < X` at 2am while watching replication lag spike.

### When to Reach for It

- Table is large enough that even filtered queries are slow despite indexing
- You have a natural partition key (time is the most common) that appears in most WHERE clauses
- You need to drop or archive data by time bucket efficiently

### Common Pitfalls

Choosing a partition key that queries *don't* filter on is the main mistake — you lose elimination and add routing overhead. Cross-partition queries (no partition key in WHERE) scan every partition. Also, too many partitions (thousands) bloat the query planner's work even when elimination is effective. Aim for dozens, not thousands.
