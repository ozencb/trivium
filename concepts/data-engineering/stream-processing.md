---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Stream Processing

Stream processing treats data as an infinite, ordered sequence of events rather than a finite dataset to query. The core insight is that most "batch" jobs are just streams where you've artificially waited to accumulate data — stream processing removes that delay and makes computation continuous.

**Core mechanism**

The runtime maintains a DAG of operators (source → transform → sink). Each operator holds local state — often a RocksDB instance embedded in the executor — and processes events as they arrive. The hard problems are:

- **Time semantics**: event time (when something happened) vs. processing time (when you received it). Out-of-order arrivals are inevitable across partitions, so frameworks use watermarks — a low-water mark saying "I've seen all events up to time T" — to know when a window can close and be emitted without waiting forever.
- **Windowing**: tumbling (fixed non-overlapping buckets), sliding (overlapping), and session (gap-based) windows are different answers to "what events constitute a meaningful group?"
- **Exactly-once**: achieved via two-phase commits between the processing engine and state store + sink. Kafka Streams uses changelog topics to replicate state; Flink uses distributed snapshots (Chandy-Lamport algorithm).

**Mental model**

Think of your Kafka topics as the persistent log and your stream processor as a stateful, fault-tolerant function running over that log. If the processor crashes, it replays from its last committed offset and restores state from the changelog. You get the durability of a database with the throughput of a queue.

**Concrete example**: counting page views per user per 5-minute window. Events arrive out of order because mobile clients batch and flush. The watermark lets you close the window at `T + 30s` (your allowed lateness), emit the count, and discard state — rather than keeping every user's count in memory forever.

**Practical patterns by role**

*Backend*: Replace polling a DB for "recent activity" with a materialized view updated by a stream processor. Your read path queries a KV store that the processor continuously writes to. Latency drops from seconds to milliseconds.

*Data*: Streaming ETL replaces nightly batch jobs. CDC events from Postgres → Kafka → Flink → Iceberg/Delta Lake gives you a data lake that's current within seconds, not hours. The pitfall is schema evolution — Avro + Schema Registry is non-optional at scale.

*SRE*: Real-time anomaly detection on metrics streams. Instead of scraping Prometheus and running batch queries, route span data through a stream processor that emits alerts when error-rate windows breach thresholds. The failure mode to watch: consumer lag growth means your processor is falling behind — check GC pressure, partition skew, or expensive state lookups.

**When to reach for it**: when freshness matters and the batch window is the bottleneck, or when you need stateful joins across event streams (e.g., correlating auth events with purchase events) that would be prohibitively expensive as repeated DB queries.
