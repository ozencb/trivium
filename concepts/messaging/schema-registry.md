---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Schema Registry

Schema Registry solves the coordination problem between Kafka producers and consumers: as your event schemas evolve, how do you ensure consumers don't receive data they can't parse? It's a versioned catalog of schema definitions that acts as a gatekeeper — producers must register a schema before publishing, and the registry enforces that the new version is compatible with what consumers already expect.

**How it actually works**

When a producer serializes a message, the Avro/Protobuf serializer doesn't embed the full schema in every message — that would be wasteful. Instead, it registers the schema (or confirms it's already registered) and receives a numeric schema ID. The wire format is just `[magic byte][4-byte schema ID][payload]`. Consumers use that ID to fetch the schema from the registry and deserialize correctly.

The real enforcement happens at registration time. The registry compares the new schema version against the previous one using a configured compatibility mode:

- **BACKWARD**: new schema can read data written by old schema (safe to upgrade consumers first)
- **FORWARD**: old schema can read data written by new schema (safe to upgrade producers first)
- **FULL**: both directions simultaneously

Adding an optional field with a default? Passes. Renaming a required field or removing one? Rejected. This turns schema drift from a runtime surprise into a CI-time failure.

**Concrete mental model**

Think of it as a type system for your message bus. The same way a compiler rejects a function call with the wrong argument types, the schema registry rejects a schema registration that would break existing readers. Except unlike a compiler, it's protecting consumers you don't own or may not even know about.

**Backend engineering context**

In a services architecture where a dozen teams consume from the same Kafka topics, schema registry is the contract enforcement layer. Without it, the team that owns `OrderEvent` quietly renames `customer_id` to `customerId`, deploys, and three downstream services start throwing deserialization errors in production. With it, that registration attempt fails in their pipeline before the code ships. You can also integrate it into your CI — run a schema diff against the registry as part of PR checks.

**Data engineering context**

Schema registry becomes the source of truth for your lakehouse or warehouse ingestion pipelines. When a new backward-compatible schema version lands (say, a new optional field is added), your Kafka-to-Iceberg connector can automatically detect the change and evolve the target table schema rather than failing. This eliminates the brittle "rewrite the DDL whenever upstream changes" pattern.

**Where it bites you**

Two common traps: teams default to `NONE` compatibility in dev environments and forget to enforce stricter modes in production; and the registry itself becomes a hard dependency — if it's unavailable and schemas aren't cached locally, consumers can't deserialize anything. Treat it with the same availability requirements as your message broker.
