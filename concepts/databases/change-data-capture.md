---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Change Data Capture

CDC taps directly into the database's replication log — the same stream your read replicas consume — to emit a structured event for every insert, update, and delete. Unlike polling a `updated_at` column or firing application-level hooks, it's exhaustive and decoupled: the database itself is the source of truth, not your code.

**The core mechanism**

Every major database maintains an ordered, append-only log of mutations before (or as) they're committed — Postgres calls it the WAL, MySQL calls it the binlog. Replication already reads this to keep replicas in sync. CDC tools like Debezium register as a "logical replication slot" (Postgres) or a replica (MySQL), receive that same stream, and re-publish it — typically to Kafka — as structured JSON events with before/after row images.

The critical detail: this log is the ground truth. It captures *everything* that actually committed, including changes made by migrations, background jobs, or other services that bypass your application code. That's the gap that polling and app-level hooks both have.

**A concrete mental model**

Think of it like a bank statement vs. a running balance. Your application might know the current account balance, but CDC gives you the *ledger* — every debit and credit in commit order. That ordering and completeness is what makes it powerful.

**Where it earns its keep**

*Cache invalidation*: Instead of manual cache busting scattered across service code, a CDC consumer watches for row changes and evicts or refreshes proactively. No more stale cache bugs from a missed hook.

*Event-driven integrations*: Service A owns a `orders` table. Service B needs to react to order state changes. Rather than coupling B into A's codebase, B consumes CDC events from Kafka. The contract is the schema of the row, not an internal API.

*Data pipelines*: Syncing OLTP → OLAP (Postgres → BigQuery, say) via CDC is dramatically more efficient than full-table dumps and handles deletes correctly — something bulk exports routinely get wrong.

**Where it gets complicated**

Schema changes are the main hazard. If you rename a column, your CDC consumers break silently or loudly depending on how they're parsing events. You need a schema registry (Confluent or otherwise) and a deployment discipline around schema evolution.

Replication lag is real: CDC events are near-real-time, not synchronous. A consumer acting on a CDC event is operating on data that was consistent *when committed*, but downstream state may have moved on.

Replication slots in Postgres hold WAL segments until consumed — a lagging or dead consumer will cause disk to fill. Monitor slot lag.

**The seniority signal**

Knowing CDC exists is table stakes. What differentiates seniors is understanding *when not to use it*: if you control all writers and can use the Transactional Outbox Pattern reliably, you get ordering guarantees and simpler failure semantics without the operational complexity of a replication slot. CDC shines when you *don't* control all writers, or when you need a complete audit trail of all mutations without instrumenting every code path.
