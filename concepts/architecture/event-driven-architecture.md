---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Event-Driven Architecture

Services usually communicate by calling each other — REST, gRPC, whatever. EDA flips this: instead of Service A telling Service B to do something, A emits a fact ("order placed") and B independently decides what to do with it. The producer has no knowledge of consumers, and consumers have no dependency on the producer's availability.

**The core mechanism**

The unit of communication is an *event* — an immutable, timestamped record of something that happened. "Order placed" not "place order." This distinction matters: commands imply intent and expectation of a receiver; events are statements of fact that stand alone. Because events are immutable records, a log of them is automatically a durable history. Consumers don't just react — they *replay* state from the log.

This is where the real power sits: the event log is the source of truth, not any service's database. Consumers derive their own materialized views from the same underlying stream.

**Concrete model**

Think of a Kafka topic like a database write-ahead log that's been promoted to a first-class interface. Producer appends. Consumers maintain their own offsets and read at their own pace — which is why backpressure is solvable here in a way it isn't with synchronous RPC. A slow consumer doesn't block the producer; it just falls behind, and the log retains messages until it catches up.

**Where it shows up**

*Backend:* Order service emits `OrderPlaced`. Inventory, billing, and notification services each consume it independently. Adding a fraud-detection service requires zero changes to the order service — it subscribes to the same event. This is the open/closed principle applied at the system level.

*Fullstack:* Real-time features (live dashboards, collaborative editing, activity feeds) are naturally modeled as event streams. The frontend subscribes to a stream and applies updates rather than polling. WebSockets or SSE become the consumer interface for the same underlying event log.

*Data engineering:* ETL pipelines collapse into stream consumers. CDC (change data capture) exposes database mutations as events. Downstream analytics, ML feature stores, and data warehouses all consume from the same stream, eliminating bespoke integration code between systems.

**What this unlocks in design discussions**

EDA forces a precision most engineers avoid: you have to name things as facts, not intentions. That discipline surfaces coupling you'd otherwise paper over with a direct call. The senior-level insight is knowing the tradeoff: eventual consistency is the default, not the exception. A consumer processing `OrderPlaced` may lag. Your system must handle that — which leads directly to Event Sourcing (storing state as the event sequence itself), CQRS (separate read/write models derived from the stream), and Sagas (coordinating multi-step workflows without distributed transactions).

The invariant to remember: in EDA, the past is immutable and shared. The present is a consumer's local projection of it.
