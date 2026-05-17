---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Event Sourcing

Instead of storing the *current state* of an entity, you store every *event* that led to that state. The database becomes an append-only log of facts; current state is always derived by replaying that log.

### The core mechanism

In a traditional system, updating an order marks it `status = "shipped"` — the previous states are gone. In event sourcing, you append `OrderShipped { orderId, timestamp, carrier }` to the event log. Current state is a left-fold over the event stream: `reduce(events, initialState, applyEvent)`. The store is immutable; you never update or delete, only append.

This distinction matters: the event log is the *source of truth*, not the projection. What you'd normally call "the database row" is actually a derived read model, reconstructed on demand or cached as a snapshot.

### Concrete mental model

Think of accounting. A bank never edits your balance directly — it posts transactions (credits, debits) and your balance is always the running sum. Event sourcing applies this model universally. The "account balance" is a projection; the transaction ledger is the source of truth. CQRS slots in naturally here: the write side appends events, the read side maintains projections optimized for queries.

### Where this shows up

**Backend:** Consider an e-commerce order with states: `Placed → PaymentConfirmed → Picking → Shipped → Delivered`. Traditional CRUD can't tell you when the order spent 3 days stuck in Picking, or reconstruct what the system state looked like last Tuesday at 2am when a customer complained. With event sourcing you replay to any point in time, run temporal queries, and reproduce bugs deterministically — which is what "time-travel debugging" means in practice.

**Data:** Event logs are naturally a Kafka-friendly model. Downstream consumers (analytics, ML pipelines, recommendation engines) subscribe and build their own projections without touching the write path. Your event history becomes a first-class data asset. Rebuilding a broken projection means replaying from the log, not running a migration or writing a backfill script.

### What senior engineers know that juniors don't

The tradeoffs are the real interview signal. Event sourcing adds complexity: projections can fall out of sync, schema evolution of events is harder than migrating a table, and eventual consistency becomes explicit. The question isn't "should we use event sourcing" but "which *aggregates* genuinely benefit from audit history and temporal queries" — and using it surgically rather than system-wide. Knowing that you can hybrid (event source the Order aggregate, not user preferences) demonstrates you understand it as a tool, not a paradigm to adopt wholesale.
