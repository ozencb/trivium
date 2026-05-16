---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Transactional Outbox Pattern

The pattern solves the dual-write problem: when you need to update a database *and* emit an event, you can't do both atomically across two systems — so you engineer it so you only have to do one.

### The Core Mechanism

Instead of publishing to a message broker directly, you write the event into an **outbox table** in the same database, within the same transaction as your business write. A separate relay process reads from that table and forwards messages to the broker.

This collapses a distributed coordination problem into a local one. Your database's ACID guarantees do the hard work: either both the business record and the outbox row commit, or neither does. The cross-system reliability problem shifts to the relay — which is easier to reason about because it's a dedicated, retryable process with a single job.

The relay has two common implementations:
- **Polling**: reads unprocessed rows on an interval, publishes, marks them done
- **CDC-based**: tails the database's transaction log (e.g., via Debezium) and reacts to inserts in the outbox table — this is the natural on-ramp to Change Data Capture

### Concrete Example

An order service processes a checkout:

```sql
BEGIN;
  INSERT INTO orders (id, user_id, total) VALUES (...);
  INSERT INTO outbox (id, event_type, payload, processed)
    VALUES (gen_uuid(), 'OrderPlaced', '{"orderId": ...}', false);
COMMIT;
```

The relay picks up the unprocessed outbox row, publishes to Kafka, then marks it `processed = true`. If the relay crashes after publishing but before marking it done, it re-publishes on retry — so downstream consumers need to handle duplicates (idempotency), but that's a far more tractable problem than preventing message loss.

### Where It Shows Up

**Backend:** Any microservice architecture where a state change needs to trigger downstream effects — inventory updates, notification sends, audit trails. Without the outbox, you're gambling that your broker publish and DB commit don't diverge during a crash window.

**Data:** When building event streams for analytics or OLAP pipelines, the outbox is a clean, queryable staging area. CDC tooling can consume it without needing access to your core business tables, giving you a reliable integration point that doesn't couple your schema to your pipeline.

### The Trade-off to Keep in Mind

You're trading broker coupling for database coupling — the outbox table lives in your service's DB. This is usually the right call, but it does mean the relay adds write amplification (two writes per operation) and you need to manage outbox cleanup to avoid unbounded table growth.
