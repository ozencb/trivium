---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Message Ordering Guarantees

Kafka guarantees strict ordering only within a single partition — messages are assigned monotonically increasing offsets and consumed in that sequence. Across partitions, there's no coordination, so a consumer can process events out of production order even if they were published milliseconds apart.

**Core mechanism:** When a producer writes a message, Kafka appends it to a partition and assigns an offset. Consumers read that partition sequentially — offset 100 always before 101. But if two related events land on *different* partitions (partition 2 and partition 3), the consumers for each have no shared clock or coordination. Event B on partition 3 can be fully processed before Event A on partition 2 is even fetched.

**Mental model:** Think of partitions as parallel lanes on a highway. Order within a lane is preserved — cars don't pass each other inside a lane. But a car that entered the highway after yours might be in a faster lane and exit before you. The highway has no mechanism to enforce cross-lane order.

**The fix — partition key discipline:** If order matters, all related events must share a partition key so they hash to the same partition. For an e-commerce order lifecycle (`OrderCreated` → `PaymentProcessed` → `OrderShipped`), using `orderId` as the key guarantees all three events land in sequence. Using a random key or round-robin breaks this silently — and usually only surfaces in prod when partition count increases.

**Backend scenarios:**
- Session events keyed by `userId` — logout can't arrive before login
- Saga orchestration — compensating transactions must see prior steps in order, so saga ID is the natural key
- Inventory mutations — decrement before increment produces phantom negative stock

**Data scenarios:**
- CDC streams from a database: key by primary key so UPDATE never precedes INSERT in the downstream consumer; getting this wrong means your read replica reconstructs incorrect state
- Event-sourced aggregates: all events for an aggregate share a partition key, otherwise replaying the log to rebuild state produces garbage

**Common pitfall:** Ordering works fine locally (single partition, low throughput) then silently breaks in production when you scale partition count or introduce a new producer that uses a different key scheme. Partition key strategy is a correctness constraint, not a tuning knob — it needs to be explicit in your schema design, not retrofitted later.

The decision heuristic: identify the "ordering domain" (the entity whose event sequence is semantically meaningful), use its ID as the partition key, and accept that cross-domain ordering requires a different mechanism — usually timestamps, vector clocks, or accepting eventual consistency.
