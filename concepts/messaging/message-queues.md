---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Message Queues

A message queue is a durable buffer sitting between services: producers write messages to it, consumers read from it, and the two sides never talk directly. The queue absorbs mismatches in speed, availability, and scale that would otherwise cause cascading failures.

**The core mechanism**

The fundamental guarantee is persistence-before-acknowledgment. A producer calls `send()`, the broker writes the message to durable storage, then returns success. Only after a consumer processes the message and explicitly acks it does the broker discard it. This means if your consumer crashes mid-processing, the message isn't lost — it times out and gets redelivered. The broker owns the message until downstream confirms completion.

This creates a critical invariant: at any moment, a message exists in exactly one of these states — undelivered, in-flight (delivered but unacked), or acknowledged. The broker's job is to enforce these state transitions correctly, even under failure.

**Mental model**

Think of a ticket queue at a busy restaurant. The kitchen (consumer) works at its own pace; the front-of-house (producer) takes orders without waiting for food to be ready. If the kitchen gets slammed, tickets pile up on the rail — but orders don't get dropped, and the front desk doesn't freeze. The queue is the rail. The kitchen can add more cooks (scale consumers) without the front-of-house changing anything.

**Practical scenarios**

*Backend:* An API receives payment submissions and immediately returns 202. A queue worker handles the actual charge asynchronously. If the payment processor is slow or down, submissions buffer instead of timing out to users. You also get retry logic for free — if the charge fails transiently, the message redelivers.

*SRE:* Message queues make your traffic shaping explicit and observable. Queue depth becomes a metric you can alert on. A growing backlog means consumers are falling behind — you scale them out before users notice. Without a queue, slow consumers just fail requests silently or propagate backpressure in hard-to-debug ways.

*Data:* A CDC pipeline emits row-change events into a queue. Multiple consumers can independently read the same stream — one updates a search index, another populates a data warehouse, another sends notifications. They proceed at different speeds without interfering. The queue absorbs burst writes during peak hours and lets your ETL catch up overnight.

**Where it breaks down**

Queues don't help if your consumer is fundamentally too slow to keep up — they just delay the inevitable. And they introduce ordering complexity: most queues guarantee at-least-once delivery, not exactly-once, so your consumers need to handle duplicate messages idempotently. The queue solves decoupling and durability; it doesn't solve correctness for free.
