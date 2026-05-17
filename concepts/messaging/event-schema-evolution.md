---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Event Schema Evolution

When your event-driven system grows, producers and consumers evolve at different rates. Schema evolution is the discipline of making schema changes without breaking existing consumers — it's the difference between a coordinated, safe rollout and a production incident at 3am.

### The Core Mechanism

Compatibility isn't binary — it has direction. The two rules that matter:

- **Backward compatibility**: new schema can read data written by the old schema. Consumers can upgrade independently of producers.
- **Forward compatibility**: old schema can read data written by the new schema. Producers can deploy before consumers catch up.

Adding an optional field with a default is both backward and forward compatible. Removing a required field, or changing a field's type, breaks one or both. Schema registries like Confluent enforce these rules at publish time — the registry rejects a schema registration that would violate the configured compatibility mode before a single message gets produced.

The subtlety engineers miss: compatibility is **transitive**. You might be compatible with v3, but not with v1 that some legacy consumer is still running. "Full transitive" mode in Confluent checks against the entire version history, which is costly but the only way to protect heterogeneous consumer fleets.

### Concrete Mental Model

Think of your event schema like a database column. Adding a nullable column is safe. Dropping a column breaks queries that select it. Renaming a column breaks everyone. The difference: with a database you control all the readers. With events, readers are distributed, potentially running old code in a separate team's deployment pipeline.

### Backend Scenarios

You're evolving a `UserRegistered` event to add a `referral_code` field. If you add it as optional with a null default, downstream order services don't break — they just ignore it. But if you rename `email` to `email_address` to match your new domain model, any consumer that pattern-matches on the old field name silently starts dropping data. No error, just missing referrals in your analytics pipeline three weeks later.

The safe approach senior engineers reach for: **versioned event types** (`UserRegistered.v2`) when changes are structural, evolving fields-only for additive changes.

### Data Scenarios

In data pipelines, schema drift is especially dangerous because consumers are often batch jobs running hourly or daily — failures compound. A Spark job reading Avro events from Kafka will fail hard if a field type changed from `string` to `int`, even if the semantic meaning is the same. Data engineers guard against this with schema evolution policies in the registry and explicit dead-letter queues for deserialization failures.

### Why This Differentiates Senior Engineers

Junior engineers think about "does this code work today." The schema evolution mindset forces you to think about **deployment topology** — who owns the producer, who owns the consumers, what's the rollout order, what's the rollback plan. In design reviews, proposing a compatibility strategy alongside the schema change signals you've operated event-driven systems at scale, not just read about them.
