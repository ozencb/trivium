---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Event Sourcing** stores state as an append-only log of immutable events rather than a mutable current state. Instead of `UPDATE users SET balance = 500`, you record `MoneyDeposited(amount=200)` and derive the current state by replaying the log.

## The Core Mechanism

The event log *is* the source of truth. Your database rows (or any other read model) are just a projection — a materialized view derived from replaying events. If you need current state, replay all events for an entity. If that's too slow, snapshot at a checkpoint and replay from there.

This inverts the usual mental model. Normally you mutate state and optionally emit events as a side effect. In event sourcing, events come first and state is always derived.

## Mental Model

Think of a bank account. A traditional system stores `{ balance: $500 }`. Event sourcing stores:

```
AccountOpened(initial=0)
MoneyDeposited(amount=300)
MoneyDeposited(amount=400)
MoneyWithdrawn(amount=200)
```

The balance of $500 is computed, not stored. You can answer questions the traditional model can't: what was my balance at 2pm on March 3rd? Who initiated each change? What would the balance be if we rolled back the last withdrawal?

## Why It Matters Beyond Auditability

The obvious benefit is a full audit trail, but that undersells it. The deeper value:

- **Temporal queries**: Reconstruct any past state by replaying up to a point in time.
- **Projections can be rebuilt**: If your read model schema changes, or you realize you need a new one (say, a materialized view for analytics), replay all events and build it fresh.
- **Event replay for debugging**: Reproduce exact system state at time of a bug.
- **Natural fit with CQRS**: The event log *is* the write side. Read models are just projections of it — subscribe to the log, maintain whatever query-optimized structure you need.

## Practical Scenarios

**Backend**: Financial systems, order management, inventory. Anywhere you care about *what happened*, not just *what is*. Also useful for complex domain logic — instead of debugging why an order is in a weird state, replay its event history and watch it unfold.

**Data**: Event stores map cleanly to Kafka or similar. Your event log becomes a durable, replayable stream. Data pipelines and ML feature stores can consume raw events and build their own projections independently of the operational system.

## The Real Cost

Querying current state requires a projection layer — you can't just `SELECT * FROM orders WHERE id = 123`. Event stores also grow without bound (mitigated by snapshots, but not eliminated). Schema evolution for events is genuinely hard: unlike a table migration, old events are immutable, so you need versioning or upcasting strategies when event structure changes.

Event sourcing is most worth the overhead when your business domain is inherently historical — when *how you got here* is as important as *where you are*.
