---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Saga Pattern

The Saga pattern solves a hard constraint: you need atomicity across multiple services, but distributed locks (2PC) are expensive, fragile, and break under partial failure. Sagas trade isolation for availability — each step commits locally and publishes an event, with compensating transactions to reverse committed work if a later step fails.

### The Mechanism

A saga is a sequence of local transactions. Each service owns its step: commits to its own database, then emits an event or message. Two coordination styles exist:

- **Choreography**: each service listens for upstream events and reacts. Decentralized, but hard to observe and reason about.
- **Orchestration**: a central coordinator (often a state machine) tells each service what to do and handles failures. More operational visibility, clearer failure semantics.

When a step fails, compensating transactions run in reverse order. These aren't rollbacks — they're new forward-moving transactions that undo business effects. A cancelled reservation doesn't erase the record; it creates a cancellation event.

### Concrete Example

Order fulfillment across four services:

1. **Order Service** — creates order (pending)
2. **Inventory Service** — reserves stock
3. **Payment Service** — charges card
4. **Shipping Service** — schedules delivery

If payment fails at step 3, the saga runs compensations: release the inventory reservation (step 2), then mark the order as failed (step 1). Each compensation must be idempotent — network retries are a given.

### What Seniors Know That Juniors Miss

Sagas are **ACD, not ACID**. They're atomic (either all steps complete or compensations run), consistent, and durable — but not **isolated**. Two concurrent sagas can observe each other's intermediate state. A customer might briefly see an order as "reserved" that ultimately gets cancelled. This is a real design constraint, not a theoretical one — you have to decide whether that's acceptable for your domain, and often it is.

This means you can't blindly apply saga to every distributed transaction. Some business invariants genuinely require isolation (financial ledgers with strict balance constraints, for instance). When a team says "we'll just use sagas everywhere," that's a flag — they're often ignoring the dirty-read problem.

### In Practice

In backend systems, sagas show up in:
- **Order management** (e-commerce, marketplace, travel booking)
- **Financial workflows** (money transfers, loan processing)
- **Account provisioning** (creating a user across auth, billing, and notification services)

The orchestration style maps cleanly to tools like Temporal, AWS Step Functions, or a hand-rolled state machine in a database. Choreography fits simpler, well-understood flows where you want less coupling.

The interview-worthy insight: sagas don't eliminate consistency problems, they make them explicit and manageable. You're accepting eventual consistency and compensability as design constraints upfront, which forces clearer domain modeling around what "undo" means for each business operation.
