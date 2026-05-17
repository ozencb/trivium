---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

**Data contracts are explicit, versioned agreements between the team producing a dataset and every downstream consumer — covering schema, field semantics, nullability, SLOs, and ownership.** Without them, pipelines break silently: a producer renames a column or changes a type, no one notices until an analytics dashboard goes dark three days later.

## The Core Mechanism

A data contract isn't just a schema. Schema Registry gives you structural validation; a data contract adds the *social layer* on top: who owns this dataset, what SLA do they commit to (freshness, completeness, latency), what do the values actually mean (is `status=2` "pending" or "archived"?), and how will breaking changes be communicated.

The contract is typically a YAML or JSON document checked into version control alongside — or referenced from — the pipeline code. Tools like **Data Contract CLI**, **Soda**, or **dbt contracts** can enforce it at runtime: they validate incoming data against the declared spec and fail loudly rather than letting bad data propagate.

## Mental Model

Think of it exactly like an API contract between microservices. When your payments service exposes `POST /charge`, consumers depend on the response shape — you don't just rename `amount` to `total` without a deprecation cycle. Data contracts apply the same discipline to datasets. The difference is that breaking a REST API fails immediately and noisily; breaking a dataset schema often fails quietly, days later, in an aggregation query.

## Practical Scenarios

**Backend:** You're building an event stream from your order service into Kafka. Without a contract, the ML team reads `order_value` as dollars, but after a currency refactor it's now cents. Their model silently starts misfiring on pricing. A contract would have flagged this as a breaking change requiring consumer approval.

**Data:** You own a dbt model that 12 downstream models depend on. Contracts let you declare that `created_at` is always UTC, never null, and that you'll maintain it for at least 6 months before deprecation. Consumers can trust those invariants; you can't silently break them without a versioned migration path.

## Where It Differentiates Senior Engineers

The junior move is treating data pipelines like batch scripts — they work until they don't. The senior move is recognizing that datasets are APIs, and APIs need contracts, versioning, and ownership. In design discussions, raising data contracts signals that you understand organizational failure modes, not just technical ones: the issue isn't usually the pipeline code, it's that no one owns the *interface*.

In interviews, connecting this to schema evolution (Avro's backward/forward compatibility), API versioning semantics, and producer/consumer ownership models shows systems-level thinking that most candidates miss.
