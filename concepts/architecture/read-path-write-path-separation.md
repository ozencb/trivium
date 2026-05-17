---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Read/Write Path Separation

Read/write path separation takes CQRS's logical command/query split and makes it physical: reads and writes travel through entirely different infrastructure stacks, each tuned for its own access patterns. The insight is that read and write workloads are adversarial — optimizing for one actively degrades the other.

**The core mechanism**

Writes demand consistency, durability, and conflict resolution. Reads demand low latency, high throughput, and often denormalized data. When both paths share the same infrastructure, you compromise both. A normalized schema that makes writes safe makes reads slow. A cache that makes reads fast makes write propagation complex. Separating them lets each path be first-class.

Concretely: writes go to a primary store (Postgres, DynamoDB, whatever), and a propagation layer (CDC via Debezium, event streaming via Kafka, or direct async writes) keeps read-optimized stores current. The read path queries those derived stores — Redis for hot data, Elasticsearch for search, a read replica with materialized views, a separate Cassandra cluster shaped for your query patterns.

**Mental model**

Think of a restaurant. The kitchen (write path) is optimized for production: organized, atomic, authoritative. The menu (read path) is optimized for consumption: pre-composed, fast to retrieve, structured for how customers ask questions — not how food is stored. The menu doesn't change every time an ingredient is restocked; there's a propagation step.

**Practical scenarios**

*Backend:* An e-commerce product catalog. Inventory updates write to a transactional Postgres database. The read path serves a denormalized, pre-joined Elasticsearch index. Reads handle 10k req/s without touching Postgres at all. The propagation lag (usually milliseconds to low seconds) is acceptable — customers don't need inventory counts to be exact to the millisecond.

*Data:* An analytics pipeline. Events write to an append-only event log (Kafka or S3). The read path materializes aggregations into a columnar store (ClickHouse, BigQuery). Ad-hoc queries never compete with ingestion throughput. Schema changes on the read side don't require touching the canonical log.

**When to reach for this**

You need it when read and write load characteristics diverge sharply — different scale, different latency requirements, or different query shapes. If your read replicas are already strained under query load, or you're adding indexes to satisfy reads that are slowing down writes, you've already hit the problem. The cost is propagation lag and operational complexity: you now own consistency windows and must reason about what "current" means on the read side. That's not free, so don't reach for it when a read replica with a few materialized views solves the problem.

The failure mode to watch: teams treat the propagation layer as an afterthought. When it falls behind or fails, read stores silently serve stale data and nothing alerts on it. The write path feels fine; the read path is lying. Always instrument propagation lag as a first-class metric.
