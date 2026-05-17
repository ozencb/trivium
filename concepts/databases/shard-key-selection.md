---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Shard Key Selection

Sharding distributes data across nodes, but the shard key determines *how* — and a poor choice bakes in a scalability ceiling that's painful to undo. The key insight is that shard key selection is fundamentally a trade-off between three competing forces that you can't fully satisfy simultaneously.

**The three-way tension**

**Write distribution**: Your shard key should spread writes across nodes roughly evenly. If you shard a time-series table by `created_at`, every write goes to the "current" shard while historical shards sit idle — a *hot shard*. Hashing a high-cardinality key (like a UUID) solves this.

**Query locality**: If a query can't be routed to a single shard, the database fans out to all shards and merges results — *scatter-gather*. This is expensive and kills tail latency. Ideally, your most common queries include the shard key in the `WHERE` clause, so the coordinator routes them to exactly one node.

**Cardinality**: You need enough distinct values to rebalance shards as you scale. Sharding by `country_code` (ISO 3166 has ~250 values) means you can never have more than 250 shards. UUID-based keys have no such ceiling.

**A concrete mental model**

Consider a multi-tenant SaaS app storing events. Three candidates:

- `timestamp`: Hot shard on current time, perfect for scatter-gather anti-pattern. Don't.
- `tenant_id`: Queries for any tenant's events hit one shard. But if one tenant generates 40% of traffic, that shard is a bottleneck — *whale problem*.
- `hash(tenant_id)`: Distributes evenly, but now "give me all events for tenant X in the last hour" is scatter-gather.

The real answer is usually `tenant_id` with monitoring and manual shard splitting for large tenants — accepting that a small number of whales need special handling rather than penalizing the query pattern for everyone.

**In practice**

*Backend*: When designing a new service's data model, the shard key question should come *before* the schema question. Ask: what are the top 3 queries? Which entity do they filter on? That entity's ID is usually your shard key. For a messaging system, it's `conversation_id`. For an e-commerce order service, it's probably `customer_id`, not `order_id` — unless your primary access pattern is order lookup by ID.

*Data*: Analytics workloads invert the tradeoff. You often *want* range scans across time, so a time-bucketed shard key with hash sub-partitioning (e.g., Cassandra's partition key = `(event_type, month)`, clustering key = `timestamp`) buys both locality for time-range queries and distribution across the cluster.

**Why this matters in senior conversations**

Junior answers name a key. Senior answers reason backward from access patterns, enumerate the hotspot risks, and explicitly call out what's being sacrificed. The tell is whether someone mentions the whale problem and cardinality constraints unprompted — those are the failure modes that only surface at scale, and recognizing them before they bite is what distinguishes design instinct from book knowledge.
