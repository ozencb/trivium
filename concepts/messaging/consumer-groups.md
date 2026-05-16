---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Consumer Groups

A consumer group is how Kafka scales consumption horizontally while maintaining ordered, exactly-once-per-message delivery within a group. Instead of every consumer seeing every message, Kafka partitions the work across group members.

### Core Mechanism

Each partition in a topic is assigned to exactly one consumer within a group at a time. If you have 6 partitions and 3 consumers in a group, each consumer owns 2 partitions and reads from them independently. No coordination is needed during reads — consumers just pull from their assigned partitions and commit offsets.

The group coordinator (a Kafka broker) tracks membership. When a consumer joins, leaves, or crashes, a **rebalance** triggers: partitions are redistributed across the current live members. During a rebalance, consumption pauses — this is the main operational cost.

One hard constraint: you can't have more active consumers in a group than you have partitions. The extras sit idle. Partition count is your parallelism ceiling.

Crucially, offset tracking is **per group**. Two groups reading the same topic maintain completely independent positions — group A can be at offset 1000 while group B is at offset 50. This is what lets multiple systems consume the same event stream without interfering.

### Mental Model

Think of a group as a team of workers and partitions as work queues. Each worker owns specific queues; no worker steals from another's queue. If a worker quits mid-shift, their queues get redistributed. If you hire more workers than there are queues, the extras stand around.

### Practical Scenarios

**Backend:** A payment service with 12 partitions runs 12 consumer instances. Traffic spikes? Scale to 12 instances and you hit full parallelism. Scaling beyond 12 does nothing until you repartition the topic.

**Data:** Multiple pipelines consume the same `user-events` topic — one feeds a real-time dashboard (group: `dashboard-v2`), another feeds a data warehouse (group: `dw-ingestion`). They advance independently; the warehouse can replay from offset 0 without affecting the dashboard.

**SRE:** Rebalance storms are a common incident pattern. If you deploy rolling restarts on 20 consumers without tuning `session.timeout.ms` and `max.poll.interval.ms`, each restart triggers a rebalance that briefly pauses all consumption. With static membership (`group.instance.id`), Kafka can skip rebalancing for rejoining members it recognizes, which matters for high-throughput topics where even seconds of pause creates lag.

The connection to backpressure: consumer groups don't slow the producer, but a slow consumer accumulates lag in its assigned partitions. Monitoring lag per group-partition (not just total lag) tells you which consumer is the bottleneck.
