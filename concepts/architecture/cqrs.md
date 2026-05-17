---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## CQRS (Command Query Responsibility Segregation)

Most systems model data the same way for reads and writes — one schema, one ORM, one data access layer. CQRS rejects this assumption: the shape of data you need to *write* correctly and the shape you need to *read* efficiently are almost never the same, so trying to satisfy both with one model means compromising both.

**The core mechanism**

You split your application into two sides. The **command side** owns writes — it enforces invariants, runs business logic, and persists to a write-optimized store. The **query side** owns reads — it serves pre-shaped, denormalized projections built specifically for UI or API consumers. Neither side knows about the other's internals.

The synchronization between them is where your Event-Driven Architecture knowledge kicks in. Commands on the write side emit domain events. The query side listens to those events and updates its read models (projections). These projections are often eventually consistent — the read side may lag behind the write side by milliseconds or seconds.

**Concrete example**

You're building an e-commerce platform. On the write side, placing an order involves complex logic: checking inventory, applying discount rules, updating customer credit, reserving stock. Your write model is normalized, transactional, and domain-rich. On the query side, a customer's "order history" page needs order ID, product name, thumbnail, status, and total — flattened, sorted, possibly paginated across millions of rows. If you query the normalized write model for that, you're joining 6 tables per request at scale.

Instead, you maintain a separate `order_history` projection (could be PostgreSQL, Elasticsearch, Redis) that gets updated whenever an `OrderPlaced`, `OrderShipped`, or `OrderCancelled` event fires. The query is now a single table scan with an index on `customer_id`.

**Why this matters in practice**

For **backend engineers**, CQRS lets you scale read and write paths independently. Your command handlers can be stateless workers behind a queue; your query side can be replicated read replicas or purpose-built stores. It also forces you to make consistency requirements explicit — which queries can tolerate stale data, and which can't.

For **fullstack engineers**, the pattern explains why some architectures have separate read APIs (often thin, fast, REST) and write APIs (often command-based, slower due to validation). It's also why optimistic UI updates work well in CQRS systems — you apply the command locally, knowing the read model will catch up.

The design discussion signal: when a senior engineer hears "our queries are slow," they ask whether the write model is being queried directly. When they hear "our domain logic is getting complex," they ask whether reads are muddying the write model. CQRS is the answer to both — not always warranted, but the lens is always useful.

This is also why Event Sourcing naturally pairs with CQRS: the event log *is* the write model, and projections are just views derived from it.
