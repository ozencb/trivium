---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Distributed Transactions

A distributed transaction coordinates writes across multiple independent services or databases so that either all succeed or all fail — preserving atomicity when a single ACID-compliant database isn't an option. The hard problem isn't the happy path; it's ensuring consistency when any participant can crash or become unreachable mid-operation.

**The core mechanism**

You already know 2PC, which is the canonical answer: a coordinator asks all participants to *prepare* (lock resources, persist intent), then issues *commit* only if everyone agreed. The guarantee is strong, but the cost is high — participants hold locks through two network round-trips, and if the coordinator crashes after *prepare* but before *commit*, participants are blocked waiting indefinitely. This is the "in-doubt" window: participants have said yes but don't know what to do next.

What makes distributed transactions fundamentally different from local transactions is that failure modes multiply. A local transaction either commits or rolls back — you get a definitive answer. Across a network, you can get *silence*, which is indistinguishable from a crash or a slow response. There's no global clock, no shared memory, and no way to atomically check state across participants.

**Mental model**

Think of booking a flight + hotel as two separate API calls. Both need to succeed, or neither should complete. A naive approach reserves the flight, then calls the hotel — but if the hotel call fails after the flight is confirmed, you've got an inconsistent state with no clean rollback path. 2PC would have both services hold provisional reservations until a coordinator confirms both are ready, then releases them simultaneously. That works — but the airline and hotel systems are now coupled through the coordinator, and latency under that lock is visible to users.

**Practical scenarios**

*Backend:* Payment processing is the textbook case — debit one account and credit another across services that may own separate databases. Also common: order placement that must atomically update inventory, create an order record, and trigger a fulfillment event.

*Data:* Cross-shard writes in a distributed database (Spanner, CockroachDB) use distributed transactions internally. If you're using Postgres + a separate analytics store and need to keep them consistent, you're in distributed transaction territory the moment you write to both in the same logical operation.

**Why this matters for what's next**

2PC's blocking nature and tight coupling led to an important design shift: instead of trying to make distributed writes *atomic*, many systems accept that they'll be *eventually consistent* and use compensating transactions to undo work if something fails. That's the Saga pattern. And to reliably publish events only when a database write succeeds — without a distributed transaction — the Transactional Outbox pattern uses the local database's own ACID guarantees as a coordination primitive. Both patterns exist precisely because distributed transactions are expensive and brittle in practice.
