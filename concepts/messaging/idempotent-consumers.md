---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Idempotent Consumers

When your broker delivers messages at-least-once, your consumers will occasionally process the same message twice — on consumer crash/restart, network hiccups, or rebalancing. An idempotent consumer is one where running the handler N times against the same message produces identical side effects to running it once.

### The Core Mechanism

There are two fundamentally different approaches, and conflating them causes bugs:

**Natural idempotency** — the operation itself is safe to repeat. `UPDATE users SET status = 'verified' WHERE id = ?` is idempotent; `UPDATE accounts SET balance = balance - 100 WHERE id = ?` is not. Reach for this first: model writes as absolute state rather than deltas where possible.

**Deduplication-based idempotency** — you track processed message IDs and skip re-execution. This works, but the failure mode is subtle: checking then acting isn't atomic. If your consumer reads "not seen this message" → applies side effect → crashes before writing the dedup record, the next run will re-apply the side effect. The fix is committing the idempotency record *in the same transaction* as the side effect. If you're working across heterogeneous stores (DB + cache + email), you need an outbox pattern or saga to achieve this atomicity.

### Concrete Example

Payment event arrives: `{ message_id: "msg-123", user_id: 42, amount: 100 }`.

Naive handler: `INSERT INTO charges (user_id, amount) VALUES (42, 100)` — duplicate delivery means duplicate charge.

Idempotent handler: `INSERT INTO charges (idempotency_key, user_id, amount) VALUES ('msg-123', 42, 100)` with a unique constraint on `idempotency_key`. Duplicate message hits a conflict, you catch it and return success. Charge applied exactly once regardless of delivery count.

### Practical Backend Scenarios

- **Webhooks**: Most providers (Stripe, GitHub, etc.) explicitly document at-least-once delivery. Store `processed_event_ids` with a unique index — this is the minimum viable approach.
- **Email/notifications**: Use a composite key of `(user_id, notification_type, reference_id)`. Raw message ID won't help if the event is re-published rather than redelivered.
- **Kafka consumers with manual commits**: A crash between processing and `commitSync()` will replay the offset. Either ensure your handler is naturally idempotent, or use exactly-once semantics (Kafka transactions) — though the latter has significant throughput cost.

### Where It Gets Subtle

Idempotency key selection matters more than people think. Message ID only works if the broker guarantees stable IDs across retries — not all do. Business-level keys (`order_id + event_type`) are more robust but require reasoning about what "same operation" means in your domain. A refund event for the same order processed twice is a business question, not just an infrastructure one.

The rule of thumb: if your system can tolerate re-delivery at all, every consumer should have an explicit answer to "what happens if this runs twice?" If the answer is "bad things," you don't have an idempotent consumer — you have a latent incident.
