---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Kafka Partitioning

A Kafka topic isn't a single queue — it's a fan of independent ordered logs, each living on a broker, each consumable in parallel. Partitioning is what makes Kafka scale: it trades global ordering for parallelism, and the partition key is the contract that defines both.

### The mechanism

When a producer sends a message with a key, Kafka runs `hash(key) % numPartitions` to pick a partition. That partition is an append-only, offset-indexed log. Ordering is strictly preserved *within* a partition, and nowhere else. Two messages with the same key will always land in the same partition, always in arrival order. Two messages with different keys might land anywhere, with no ordering relationship between them.

This is deliberately simpler than consistent hashing — partition count is fixed at topic creation, so the ring doesn't need to be virtual. The tradeoff is that changing partition count later breaks existing key assignments, which is a footgun with stateful consumers.

Each partition is also the unit of consumer assignment: within a consumer group, one consumer owns one partition. So `numPartitions` is a hard ceiling on your consumer-group parallelism. You can have 20 consumers and 8 partitions — 12 consumers will sit idle.

### Mental model

Picture a multi-lane highway where every car with the same license plate must stay in its assigned lane forever. Lane order is preserved; inter-lane order is undefined. Adding cars to a lane doesn't affect other lanes. That's a partition: isolation, order, and parallelism in one structure.

### Backend

User activity streams are the canonical case: partition by `userId` and every consumer processing a user's events sees them in the exact order they happened. This matters for anything stateful — session reconstruction, fraud scoring, or incrementally updating a read model. The invariant is: all events for a given entity flow through a single, ordered pipe.

### Data

In an ETL pipeline consuming CDC events from a database, partition by primary key. Each partition consumer can maintain a small in-memory state (last seen version, deduplication set) without coordination, because no other consumer will see the same entity. Without this, you'd need distributed locks or idempotent merges downstream.

### The real pitfalls

**Hot partitions** are the most common failure mode — pick a low-cardinality key (like `isPremium: true/false`) and one partition absorbs all traffic. Monitor partition lag per-partition, not just topic-level.

**Ordering scope** bites people who assume Kafka is a global queue. If you care about ordering across entities, you need a single partition — which destroys the parallelism you bought Kafka for. The right answer is usually to model your keys so ordering only needs to hold within an entity boundary.

Partitioning is what makes consumer groups non-trivial: once you see that a partition maps 1:1 to a consumer, the rebalancing behavior of consumer groups becomes mechanically obvious.
