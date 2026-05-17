---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Consumer Groups

A consumer group is how Kafka turns a single topic into a parallelizable workload: multiple consumer instances share a group ID, and Kafka's group coordinator assigns each partition to exactly one member at a time. Since you already know partitions are the unit of ordering, this maps cleanly — the guarantee is per-partition, not per-topic, so two consumers in the same group never race on the same partition.

**The core mechanism**

When a consumer joins or leaves a group, Kafka triggers a *rebalance*: the group coordinator (a broker) pauses all consumers and redistributes partition assignments. This is why consumer group membership changes are expensive. Each consumer tracks its own offset per partition, committing back to Kafka so that after a crash, a replacement consumer picks up where its predecessor left off — not from the beginning.

The number of active consumers in a group is bounded by the number of partitions. If you have 12 partitions and 15 consumers in the same group, 3 sit idle. This is the hidden tax: scaling your consumer fleet beyond partition count gives you nothing except faster failover.

**Mental model**

Think of partitions as lanes on a highway and consumer instances as toll booths. A consumer group is the toll plaza — one booth per lane. Adding booths beyond the lane count just means idle staff. Different consumer groups are entirely separate plazas: each gets its own independent offset pointer and processes every message. This is how you fan-out the same topic to a billing service and an analytics pipeline without coupling them.

**In practice**

*Backend*: Order processing services use one group per logical concern — one for fulfillment, one for notifications. They consume the same `orders` topic independently and at their own pace. If fulfillment is slow (backpressure), it doesn't block notifications.

*Data*: ETL pipelines consuming from a raw events topic use a dedicated group. Since each pipeline has its own offsets, you can rewind a failing pipeline to replay events without touching any other consumer.

*SRE*: Lag monitoring is per-group, per-partition. When you see lag climbing on a subset of partitions, it usually means one consumer instance is overloaded or stuck — not the whole group. The per-partition granularity makes it easy to identify whether you need more consumers (and thus more partitions) or just a fix to a slow handler.

**Common pitfall**

Committing offsets too eagerly — before processing is confirmed — means a crash after commit but before actual work results in silent message loss. Committing too late means reprocessing on restart. The pattern that holds up: process, *then* commit, and design handlers to be idempotent so duplicate processing on failure is safe rather than catastrophic.
