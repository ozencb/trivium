---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Dead-Letter Queues

When a message fails processing repeatedly — bad payload, downstream service down, bug in consumer logic — the naive outcome is the queue retries it forever. This starves your consumers and blocks everything behind it. A dead-letter queue (DLQ) is a separate destination where messages are routed after exhausting their retry budget, getting them out of the hot path without discarding them.

### The Core Mechanism

Most brokers (SQS, RabbitMQ, Kafka with some configuration) let you attach a DLQ policy to a queue: after N failed deliveries or delivery attempts, the broker moves the message to the DLQ automatically. The original queue moves on. The DLQ sits idle until you look at it — it's not consumed by your application in normal operation.

What makes this non-trivial is the **poison pill problem**. A single unprocessable message at the head of a FIFO queue blocks all subsequent messages. Without a DLQ, you're either dropping messages (data loss), retrying indefinitely (consumer liveness failure), or writing complex skip logic in application code. The DLQ offloads that decision to infrastructure, where it belongs.

### Concrete Example

Imagine an order-processing service consuming from a queue. A malformed order arrives — maybe a currency field is `null` due to a frontend bug. Your consumer throws, retries 3 times, then gives up. Without a DLQ, that message either sits there blocking or gets dropped. With a DLQ, it's moved out of the main queue after 3 failures. Order processing continues for everyone else. Later, you query the DLQ, inspect the message, fix the bug, and replay it.

### Practical Patterns

**Backend:** DLQs are your audit trail for processing failures. Instrument them — alert when DLQ depth grows unexpectedly, because a spike usually means a bug hit production. Never let DLQs drain silently; set TTL carefully so messages don't expire before you can investigate. Replay pipelines are worth building: a script that re-enqueues DLQ messages to the original queue after you've deployed a fix.

**SRE:** DLQ depth is a leading indicator, not a lagging one. If your main queue depth is fine but DLQ depth is climbing, something is systematically broken. Include it in your SLO dashboards alongside consumer lag. Also watch for DLQ feedback loops: if your replay logic itself fails, messages can DLQ again — make sure replays go through the same retry policy.

### Connection to At-Least-Once Delivery

DLQs are what make at-least-once delivery *safe in practice*. At-least-once means your consumer will see a message at least once, but possibly more — so idempotency matters. When a message lands in the DLQ, it's a signal that idempotency or error handling broke down somewhere. Inspecting DLQ messages usually reveals which assumption about your consumer failed.
