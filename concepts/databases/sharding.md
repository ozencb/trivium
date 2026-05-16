---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

Database sharding is a horizontal partitioning strategy where you split a single database into multiple independent databases (shards), each owning a subset of the data — primarily to overcome the write/storage ceiling of a single machine.

## Core Mechanism

The key insight: sharding moves beyond replication. Replicas give you read scale and redundancy, but every write still hits every node. Sharding partitions the *write path* — each shard accepts writes for its slice of the keyspace only, so you scale writes linearly (roughly) by adding shards.

You need a **shard key** — a field whose value determines which shard owns a given row. The shard key runs through a routing function (often consistent hashing, which you already know) to map a key to a shard. That routing logic lives either in the application, a proxy layer (e.g. Vitess, PgBouncer), or a dedicated router service.

The tricky part isn't the happy path — it's what the shard key *can't* do. Queries that don't include the shard key require a scatter-gather: fan out to all shards, collect results, merge. That's expensive and operationally painful, which is why shard key selection is the critical design decision. A bad shard key (low cardinality, hot keys) causes hotspots where one shard takes disproportionate load.

## Concrete Mental Model

Imagine a `users` table sharded by `user_id`. Shard 0 owns user IDs 0–999k, shard 1 owns 1M–1.999M, etc. (range-based) — or with consistent hashing, it's distributed more evenly. `SELECT * FROM users WHERE user_id = 5` routes to exactly one shard. `SELECT * FROM users WHERE email = 'x@y.com'` hits all shards and aggregates.

## Practical Scenarios

**Backend:** You're building a multi-tenant SaaS. Sharding by `tenant_id` isolates tenant data to specific shards, gives natural blast radius containment, and lets you move noisy tenants to dedicated shards. Your ORM needs to be shard-aware, or you put a proxy in front.

**Data:** Analytical queries become painful because cross-shard JOINs don't exist — you end up ETL-ing into a warehouse (Redshift, BigQuery) where the data is reunified. Sharding and OLAP are usually separate concerns for this reason.

**SRE:** Each shard is an independent failure domain, which is good. But operational complexity multiplies — schema migrations run on N shards, backup/restore is per-shard, and resharding (rebalancing when you add shards) is a painful live operation. Consistent hashing reduces resharding pain but doesn't eliminate it.

The rule of thumb: reach for read replicas and vertical scaling first. Shard when you've hit the write wall and can tolerate the query routing constraints.
