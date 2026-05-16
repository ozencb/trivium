---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Change Data Capture

CDC is the practice of treating every row-level change in your database — inserts, updates, deletes — as an event that can be streamed to downstream consumers. The core motivation: instead of polling tables or maintaining complex dual-write logic, you let the database itself be the source of truth for what changed and when.

### The Mechanism

You already know the WAL is a durability guarantee — every committed write goes there before it touches the actual data files. CDC exploits this: a log reader process tails the WAL, decodes each record into a structured change event (before/after image of the row, operation type, timestamp, LSN), and publishes those events to a stream.

This is fundamentally different from triggers or application-level dual-writes. The WAL already exists and is exhaustive — CDC just reads it. Tools like Debezium connect to Postgres's logical replication slot (or MySQL's binlog, or MongoDB's oplog) and emit change events as the replication stream flows.

The Transactional Outbox Pattern is a manual approximation of this idea — you write to an outbox table in the same transaction so you don't lose the event. CDC with WAL tailing makes the outbox unnecessary: the WAL *is* the outbox. The commit itself is atomic with the change record.

### Concrete Mental Model

Imagine your `orders` table. A CDC stream for it looks like:

```
{ op: "INSERT", table: "orders", after: { id: 42, status: "pending", ... }, lsn: 12345 }
{ op: "UPDATE", table: "orders", before: { status: "pending" }, after: { status: "shipped" }, lsn: 12401 }
```

Every downstream system — a cache, a search index, a data warehouse — can subscribe to this stream and stay synchronized without ever touching the source database with queries.

### Practical Scenarios

**Backend:** You have a microservice that owns the `accounts` table but three other services need to react to account state changes. Rather than calling them via API (tight coupling) or implementing outbox manually in every write path, CDC emits change events that each service consumes independently. It also gives you exactly-once delivery guarantees tied to LSN position, so consumers can resume without re-reading the source.

**Data:** Your analytics warehouse needs near-real-time data but ETL jobs run hourly and strain the production database with bulk reads. CDC lets you stream changes continuously into a Kafka topic, which Flink or a Spark streaming job transforms and loads incrementally. No full-table scans, no polling overhead, and the latency drops from hours to seconds.

### The Tradeoff to Know

CDC consumers are coupled to your schema. A column rename or type change in the source table is a breaking change for every downstream consumer. Schema registries (like Confluent's) exist to manage this, but it's the main operational friction.
