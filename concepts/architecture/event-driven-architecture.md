---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Event-Driven Architecture

Instead of services calling each other directly, they communicate by emitting and reacting to events — decoupling who produces state changes from who cares about them.

### The Core Idea

In a request-driven system, Service A calls Service B synchronously: A waits, B responds, both are coupled in time and in knowledge of each other. EDA flips this. When something meaningful happens, a service emits an event ("order placed", "payment failed") onto a bus or log. Any service that cares subscribes and reacts independently. The producer doesn't know or care who's listening.

The critical mechanism is the **event log** (Kafka, Kinesis, Pulsar). Unlike a message queue that deletes messages after consumption, a log retains events in order. Consumers track their own offset — how far they've read. This means you can add a new consumer and replay from the beginning, or a crashed consumer can pick up exactly where it left off. You already understand backpressure: the offset model is precisely how consumers apply it — they read at their own pace without telling producers to slow down.

Events are immutable facts about the past. "UserEmailChanged" is not an instruction; it's a record of what happened. This distinction matters because it shifts the model from imperative ("go do X") to declarative ("X happened, figure out what to do").

### Concrete Example

An e-commerce checkout:

- **Order Service** emits `OrderPlaced { orderId, items, userId }`
- **Inventory Service** listens → reserves stock
- **Notification Service** listens → sends confirmation email
- **Analytics Service** listens → updates conversion funnel

None of these services know each other exist. Adding a "Fraud Detection Service" means subscribing to the same event — zero changes to the Order Service.

### Where This Matters in Practice

**Backend:** Long-running workflows (order fulfillment, provisioning pipelines) where synchronous chaining creates fragility. If Inventory is down, Order Service still completes — Inventory catches up when it recovers.

**Fullstack:** Real-time UI updates without polling. The frontend subscribes to a WebSocket or SSE stream that's driven by the same event log. "Order status changed" flows from backend event to browser UI without a request/response cycle.

**Data:** ETL pipelines and analytics become event consumers. Rather than scheduled batch jobs querying databases, your data warehouse subscribes to change events (CDC — change data capture — essentially treats the database's write-ahead log as an event stream). Lower latency, less load on the source system.

### The Tradeoff to Internalize

You gain temporal decoupling and scalability. You lose easy traceability and transactional guarantees. Debugging a failure now means correlating events across services with a shared `correlationId`. And "what's the current state?" requires either querying downstream projections or replaying events — which is exactly where Event Sourcing and CQRS come in.
