---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Cross-Shard Queries

Once you shard a database, any query that needs data from more than one shard becomes a cross-shard query — and the database can no longer handle it as a single atomic operation.

### The core problem

When your data is on one node, a `JOIN`, `GROUP BY`, or `ORDER BY` is a local operation — the query planner has full visibility. After sharding by, say, `user_id`, user 1's orders live on shard A and user 2's orders live on shard B. A query asking "what's the total revenue across all users last month?" now requires touching every shard. Nothing coordinates that automatically.

The typical execution model becomes: your application layer (or a query router) fans out the query to all relevant shards in parallel, collects partial results, then merges them. This scatter-gather pattern sounds simple but surfaces several hard problems:

- **Partial aggregations**: Each shard computes a local `SUM`. Merging sums is easy. Merging a `MEDIAN` or `DISTINCT COUNT` across shards is not — you can't just add medians together.
- **Cross-shard JOINs**: If orders are sharded by `order_id` and users by `user_id`, joining them means one side of the join has to move across the wire. You're doing a distributed hash join manually, which is expensive and error-prone.
- **Ordering and pagination**: `LIMIT 10 ORDER BY created_at` requires fetching the top 10 from every shard, then picking the global top 10. A query that's cheap locally becomes O(shards × limit) in data transfer.
- **Transactions**: Cross-shard writes that need atomicity require distributed transactions (2PC or sagas), which reintroduce the coordination overhead sharding was meant to eliminate.

### Concrete example

You shard a multi-tenant SaaS by `tenant_id`. Querying a single tenant's data is fast — it hits exactly one shard. But your analytics dashboard needs cross-tenant metrics: "how many active users signed up this week across all tenants?" That query hits every shard, aggregates locally, merges globally. At 50 shards with 10ms latency each (parallel), you're adding a merge step and potentially megabytes of intermediate data flowing through your app tier.

### Practical implications

**Backend**: Design your shard key to make your hottest query paths shard-local. Cross-shard queries should be the exception, not the rule. If you find yourself doing them frequently, your shard key is probably wrong.

**Data/Analytics**: This is why OLAP workloads often don't live on your sharded OLTP database at all. Tools like ClickHouse, BigQuery, or Redshift are built to scatter-gather across nodes efficiently, with query planners that understand distributed aggregation. Replicating OLTP data into a columnar store sidesteps the cross-shard problem entirely for analytical queries.

The core tradeoff: sharding buys write scalability and isolation at the cost of query flexibility. Cross-shard queries are where that cost becomes visible.
