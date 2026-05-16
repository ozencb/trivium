---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Kafka Partitioning

Kafka partitions a topic into ordered, independent log segments so that reads and writes can scale horizontally across brokers and consumers. Without partitioning, every consumer would be bottlenecked on a single stream.

### Core Mechanism

A partition is an append-only, immutable log. Each message gets a monotonically increasing **offset** within its partition—not globally across the topic. When a producer sends a message, Kafka assigns it to a partition by:

1. Using the message key: `murmur2(key) % numPartitions` (similar to how you'd slot keys in consistent hashing, minus the virtual nodes)
2. Falling back to round-robin if no key is provided

The critical invariant: **ordering is guaranteed only within a partition, never across partitions**. If you need all events for a given entity to be processed in order, they must land in the same partition—which means they need the same key.

### Mental Model

Think of a topic as a highway. Partitions are lanes. Cars (messages) with the same license plate prefix always go into the same lane. A car without a plate rotates lanes. Lanes never merge—what enters lane 3 at mile 0 exits lane 3 at mile 100, in sequence.

The number of lanes is fixed at topic creation. You can add lanes later, but existing cars don't redistribute—which is why choosing `numPartitions` upfront matters.

### Backend Scenarios

Say you're building an order processing system. Using `order_id` as the message key guarantees all state transitions for a single order (`created → paid → shipped → delivered`) land in the same partition, so a consumer sees them in order without needing distributed coordination.

Without a key, a `payment_failed` event could be consumed before `payment_initiated` by a downstream service, breaking idempotency logic.

Also relevant: partition count directly caps your consumer parallelism. If you have 12 partitions and spin up 20 consumer instances in a group, 8 sit idle. This is the throughput ceiling for a single consumer group—which is why Consumer Groups become interesting next.

### Data Engineering Scenarios

In a pipeline ingesting clickstream events, you'd partition by `user_id`. This means all events for a user land on one partition, making sessionization and windowed aggregations stateful-but-local—each consumer owns its slice of users and never needs cross-partition joins for per-user logic.

If you partition randomly instead, you can achieve higher raw throughput but lose key locality, which forces you into shuffle-heavy joins downstream (think Spark's wide transformations).

### The Key Tradeoff

More partitions = more parallelism = more broker/controller overhead (file handles, replication, leader election). There's no free lunch. A common starting point is 3–6× the number of brokers, tuned upward when you hit throughput limits.
