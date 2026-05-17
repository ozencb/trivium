---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Cross-Shard Queries

When you shard a database, you trade query simplicity for scale. Cross-shard queries are the debt you pay: any query that can't be answered by a single shard must fan out across multiple shards, collect results, and merge them — a pattern called scatter-gather.

**The core mechanism**

In a sharded system, each shard owns a slice of the keyspace. A query scoped to one shard key (e.g., `WHERE user_id = 42`) routes directly to one shard — fast, cheap. But queries that don't filter on the shard key, or that aggregate across many entities, have no home. The query coordinator must broadcast to all N shards, wait for all N responses, then merge, sort, deduplicate, or aggregate the results in memory. Latency becomes O(slowest shard), not O(average shard), and you've now coupled your query latency to fleet health.

**Concrete example**

Say you shard an e-commerce orders table by `user_id`. Fetching a user's orders: single shard, trivial. Now product management wants "total revenue by country for last 30 days." Country isn't your shard key — you scatter to every shard, pull partial revenue aggregates, sum them in the application layer. At 10 shards this is annoying. At 500 shards, it's a bottleneck that can take down your analytics pipeline.

**How engineers actually deal with this**

Two primary strategies emerge:

1. **Scatter-gather** — accept the fan-out but make it fast. Parallelize the sub-queries, push as much aggregation down to each shard as possible (partial sums, filtered counts), minimize what crosses the wire. This is what most OLTP sharded systems do for infrequent cross-shard queries.

2. **Denormalization / pre-aggregation** — eliminate the cross-shard query entirely by writing the data differently. Maintain a separate unsharded (or differently-sharded) summary table that gets updated on writes. The classic tradeoff: you pay on writes to avoid paying on reads.

**Why this matters in practice**

For **backend engineers**, cross-shard queries are where naive feature requests turn into architectural discussions. "Add a leaderboard" or "show all active sessions" sounds simple until you realize those require scatter-gather across every user shard. The shard key isn't a storage detail — it's a contract about what queries will be cheap.

For **data engineers**, cross-shard queries are often why OLAP workloads get offloaded to a data warehouse entirely. Sharded OLTP databases are optimized for point lookups; analytical queries that aggregate broadly are fundamentally at odds with that design.

**The senior-engineer signal**

In design discussions, knowing to ask "what queries need to run on this data?" *before* picking a shard key separates engineers who understand sharding from engineers who've only used sharded systems. The shard key decision is really a decision about which queries you're willing to make expensive.
