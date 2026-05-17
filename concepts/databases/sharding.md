---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Database Sharding**

Sharding horizontally partitions data across independent database instances, each owning a disjoint subset of rows determined by a shard key. You reach for it when write throughput or dataset size exceeds what vertical scaling can provide — a single node has hard ceilings on CPU, memory, and I/O.

**Core mechanism**

The shard key determines which shard owns a given record. Two dominant strategies:

- **Range-based**: shard 1 holds `user_id` 1–1M, shard 2 holds 1M–2M. Enables range scans, but risks hotspots if traffic concentrates in a range.
- **Hash-based**: `hash(key) % N` distributes load evenly but destroys range locality — range queries require scatter-gather across all shards.

This is where consistent hashing pays off: rather than `hash(key) % N` (which remaps ~all keys when shard count changes), consistent hashing minimizes key movement during rebalancing.

The invariant sharding introduces is **data locality per shard key** — any operation touching records with the same shard key value is local; anything crossing shard key values is not.

**Mental model**

Replace one big filing cabinet with many smaller ones, each owned by a different department. Filing and retrieval within a department is fast. Queries spanning departments require coordination — someone must ask each department and assemble results. The shard key is the rule determining which department owns a document.

**Practical connections**

*Backend*: Application code (or a proxy layer) must route writes and reads to the correct shard. If your shard key is `tenant_id`, a multi-tenant SaaS isolates tenant data cleanly — but "find all users who signed up this week" now requires fanning out to every shard and merging results in memory. Schema migrations become a coordination problem: you can't `ALTER TABLE` atomically across shards.

*Data*: Aggregations and joins crossing shard boundaries are expensive or impossible at the database layer. Analytics workloads typically replicate sharded data into a columnar store (Redshift, BigQuery) where cross-shard queries are native. Low-cardinality shard keys (e.g., `country`) create hot shards — one instance absorbs disproportionate load.

*SRE*: Each shard is an independent failure domain — a shard going down affects only its key range, not the whole dataset. But you're now managing N databases, each needing its own replication, backups, and capacity planning. Rebalancing (adding shards) requires moving data while serving live traffic, which is nontrivial without downtime.

**The senior-level insight**

The shard key is a schema-level decision that's nearly impossible to change without rebuilding the dataset. Getting it wrong means either hotspots (load imbalance) or pervasive cross-shard queries (negating the benefit). The first question in any sharding design discussion should be: *what are the access patterns, and does the proposed shard key keep related data co-located?*
