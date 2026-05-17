---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Exactly-Once Semantics

Exactly-once delivery is the guarantee that a message produces its effect on state *precisely once*, regardless of retries on the producer side or crashes on the consumer side. It's the hardest of the three delivery guarantees to achieve because failures at any layer—network, broker, consumer—create windows where duplicates or losses can slip through.

**Why it's hard**

At-least-once is achievable because you just retry until you get an ack. Idempotency handles duplicates *after* delivery. But exactly-once requires eliminating duplicates *before* they affect state, which means you need atomicity across the act of consuming a message and recording that it was consumed. The core mechanism is a transactional write that spans: (1) marking the message as processed and (2) committing the side effect—both in the same atomic operation. If either half fails, the whole thing rolls back.

**The boundary problem**

This is where senior engineers earn their keep: exactly-once is only achievable within a single system's transaction boundary. Kafka's exactly-once (with idempotent producers + transactional APIs) gives you exactly-once *within Kafka*—from producer to topic partition. The moment your consumer writes to a Postgres database, you've crossed a system boundary. Now you need two-phase commit or you fall back to at-least-once + idempotency on the consumer side.

The mental model: imagine a message represents "charge user $50." Exactly-once within Kafka means the message appears in the topic exactly once. But charging the user is a Stripe API call—a different system. You cannot get true end-to-end exactly-once here; you get at-least-once delivery of the charge attempt, and you rely on Stripe's idempotency keys to make it safe.

**Backend context**

In distributed systems, when an order service publishes an "order placed" event, the fulfillment service consuming it might crash after updating inventory but before acking. With Kafka transactions, you can atomically commit the Kafka offset and the DB write together—but only if both live within the same transactional scope. Outside that, you use outbox pattern + idempotency.

**Data context**

In stream processing (Flink, Kafka Streams), exactly-once means aggregations like running totals won't double-count during recovery from a checkpoint. Flink achieves this via distributed snapshots and two-phase commit to its sinks. Data engineers who understand this can reason about why their pipeline's output is accurate even after node failures, rather than just hoping it is.

**The interview signal**

Most engineers conflate "idempotent consumer" with "exactly-once." The distinction that stands out: idempotency is a property of the handler; exactly-once is a property of the system boundary. Knowing where that boundary sits—and what it costs to cross it—is what separates someone who can design a reliable event-driven system from someone who just draws arrows between boxes.
