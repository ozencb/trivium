---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**CQRS (Command Query Responsibility Segregation)** separates the model you use to mutate state from the model you use to read it. The motivation is that read and write requirements diverge almost immediately in real systems, and forcing them to share a model means both suffer.

## The Core Idea

In a standard CRUD setup, you read from and write to the same schema. This seems fine until your query patterns don't match your write structure — you start joining five tables to render a list view, or you add denormalized columns "just for reads," or your normalized write schema makes certain queries genuinely expensive.

CQRS names and formalizes the split: **Commands** mutate state (and return nothing or just an acknowledgment), **Queries** return data (and never change state). More importantly, you maintain separate models for each — potentially separate schemas, separate services, separate databases.

The write side owns the invariants: it validates, enforces business rules, and persists to a normalized, authoritative store. The read side owns the projections: it maintains denormalized views optimized for exactly what the UI or downstream consumers need.

## Concrete Example

Say you're building an order management system. Your write model is a normalized relational schema — `orders`, `order_items`, `customers`, `products`. When a `PlaceOrder` command comes in, you validate inventory, check payment, write to these tables.

Your read side might maintain a materialized view called `order_summaries` — a flat structure with customer name, item count, total, status, pre-joined and pre-computed. When a query for "list all pending orders" comes in, it hits this table directly. No joins. No latency from normalization.

When the write side commits an order, it publishes an event (here's where your Event-Driven Architecture knowledge kicks in). A read-side projector consumes that event and updates `order_summaries`. Synchronously or async depending on your consistency requirements.

## Practical Scenarios

**Backend:** Any system where read volume vastly outpaces writes, or where different consumers need radically different shapes of the same data. Reporting services, audit dashboards, public APIs serving high traffic — these benefit from read models tuned to their specific access patterns rather than general-purpose schemas.

**Fullstack:** Real-time collaboration tools or dashboards where you need multiple live projections of the same underlying data. Your write side handles one clean domain model; your read side maintains several denormalized projections — one per view or component — updated as events flow through.

## Why It Matters

CQRS isn't about microservices or eventual consistency by default — you can start with CQRS in a monolith with a single DB, just using separate query objects and command handlers. The payoff is you can evolve read and write sides independently, and scale them independently.

It also sets the foundation for **Event Sourcing** — once your write side emits events that the read side consumes, you're one step from making those events the primary store rather than a side effect.
