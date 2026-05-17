---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Transactional Outbox Pattern

The dual-write problem is where most distributed systems quietly break: you save an order to Postgres, then publish an `OrderCreated` event to Kafka — and if the app crashes between those two, you've got data that diverged silently. The Transactional Outbox Pattern closes that gap by making event publishing part of the same ACID transaction as your domain write.

### The Mechanism

Instead of publishing directly to a message broker, you write the event to an `outbox` table in the same database transaction as your domain record. A separate process — a relay — polls that table (or reacts to CDC) and publishes the events to the broker, marking them as sent. The invariant is: if the transaction committed, the event will eventually be delivered. If it rolled back, neither the domain record nor the outbox row exists.

```sql
BEGIN;
  INSERT INTO orders (id, status) VALUES ($1, 'placed');
  INSERT INTO outbox (aggregate_id, event_type, payload)
    VALUES ($1, 'OrderCreated', $2);
COMMIT;
```

The relay is now responsible for at-least-once delivery, not your application code. You've moved from "maybe published" to "will be published."

### The Tricky Parts

**At-least-once, not exactly-once.** The relay can publish before it marks the row sent, then crash and republish. Consumers must be idempotent — this is non-negotiable and often underestimated.

**Relay design matters.** Polling adds latency and database load. CDC (Change Data Capture) — reading the database's write-ahead log — is lower latency and doesn't require polling queries, but adds operational complexity. Tools like Debezium sit in this space.

**Ordering.** Per-aggregate ordering is usually achievable (poll by `aggregate_id` + sequence). Global ordering is harder and often not worth pursuing.

### Practical Scenarios

**Backend:** Any time you're mutating state and need a downstream system to react — order service emitting to fulfillment, payment service notifying notifications service. Particularly critical when the domain DB and broker are separate systems (always).

**Data:** Outbox is a reliable way to stream operational data into a data warehouse or analytics pipeline without dual-writing from application code. The relay feeds Kafka, Kafka feeds your lakehouse. Compare this to querying prod directly or building fragile ETL on top of polling.

### Why It Matters in Senior Conversations

When someone proposes "just publish after the commit," the outbox pattern is the correct pushback — and knowing *why* (the window between commit and publish, the crash scenarios) signals you've operated distributed systems under real conditions. It also sets up the natural next question: if you're already reading the WAL for CDC, do you even need an outbox table, or can CDC capture the domain table's events directly? That's where this pattern bleeds into CDC design, and being fluent in both is what separates "knows the pattern" from "understands the tradeoffs."
