---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Saga Pattern

A Saga is a sequence of local transactions coordinated to achieve what would otherwise require a distributed transaction — without the locking and tight coupling that 2PC brings. The key insight is that you trade atomicity for eventual consistency, using **compensating transactions** to undo work when something fails downstream.

### Core Mechanism

Each step in a saga performs a local transaction and then either emits an event or calls the next service. If step *n* fails, the saga executes compensating transactions for steps *1 through n-1* in reverse order to restore consistency.

Two implementations exist:

- **Choreography**: Services react to events directly. No central coordinator — each service knows what events to emit and what to listen for. Looser coupling, but causality is harder to trace.
- **Orchestration**: A saga orchestrator (a dedicated service or workflow engine) tells each participant what to do and handles failures explicitly. Easier to reason about, clearer failure handling, but the orchestrator becomes a coordination bottleneck.

### Concrete Example

You're building an e-commerce checkout flow. A single "place order" operation touches three services: inventory, payment, and fulfillment.

```
1. Reserve inventory         → success
2. Charge payment card       → success  
3. Create fulfillment order  → fails (warehouse system down)
```

Now you need to roll back:
```
3'. (nothing to undo)
2'. Refund the charge
1'. Release the inventory reservation
```

Each compensating transaction must be **idempotent** — you may retry them, and executing twice should produce the same outcome as once.

### Practical Considerations for Backend Work

**Saga state needs to be persisted.** If your orchestrator crashes mid-saga, it must be able to resume. You typically store saga state in a database with each step transition, which means your saga is itself a stateful workflow.

**Compensations aren't always perfect.** Canceling a shipped package isn't a true rollback — it's a semantic undo. Design compensations to be "good enough" rather than perfectly reversible.

**Idempotency keys matter everywhere.** When retrying a step after a crash, the downstream service must handle duplicate requests gracefully. This is where your existing knowledge of idempotency keys pays off directly.

**Choreography vs. orchestration in practice**: Choreography works well for simple linear flows; orchestration is worth the overhead once you have branching logic, parallel steps, or complex failure handling. Temporal, AWS Step Functions, and Conductor are common orchestration choices.

The tradeoff vs. 2PC is explicit: you give up synchronous atomicity in exchange for availability and decoupling, and you accept that the system may be transiently inconsistent between steps.
