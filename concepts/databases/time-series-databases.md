---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Time-Series Databases

Time-series databases are storage engines built around a single constraint: data always arrives with a timestamp and is almost never updated. That constraint unlocks aggressive optimizations impossible in general-purpose databases.

### Core Mechanism

The fundamental insight is that metrics exhibit **temporal locality** — values close in time are numerically close to each other. CPU usage drifting from 42.1% to 42.3% to 42.5% compresses dramatically using delta encoding (store the first value, then just the differences). Timestamps compress even better: if samples arrive every 10 seconds, you store the start time + the interval, not each raw epoch.

Data is physically organized into **time-partitioned chunks** (InfluxDB calls them shards, TimescaleDB calls them chunks). Each chunk covers a time range — say, one hour — and is stored as a self-contained columnar block. When a chunk ages out, the database can compress it more aggressively, downsample it to lower resolution, or drop it entirely via a retention policy without touching other data. This is what makes bulk expiration cheap: dropping a chunk is a file deletion, not millions of row deletes.

**High cardinality is the primary footgun.** Tags like `server_id=db-01` are fine. Tags like `request_id=abc-123-xyz` are not — the in-memory series index explodes because each unique combination of tags creates a new logical series. InfluxDB and Prometheus will crater under cardinality pressure before they crater under write volume.

### Mental Model

You're ingesting 1,000 servers × 50 metrics × 1 sample/second = 50,000 writes/sec. In Postgres, that's 50k INSERTs hammering a B-tree index with increasing timestamps, plus you'd need a background job to purge old rows. In InfluxDB, those writes land in an in-memory WAL, get sorted and delta-compressed in batch, then flush to immutable columnar chunks. Querying "p99 latency across all services over the last 6 hours" scans only two or three chunks and never touches historical data.

### Practical Scenarios

**Backend:** Reach for a TSDB when your query patterns are time-range aggregations over high-frequency writes — APM, IoT sensor pipelines, game telemetry, financial tick data. If you need to join metrics with relational data, TimescaleDB (Postgres extension) is the pragmatic choice — you get SQL and the Postgres ecosystem with chunk-based partitioning underneath.

**SRE:** Prometheus is a TSDB. Its retention limits and single-node architecture are why Thanos and Cortex exist — they add distributed long-term storage on top. When designing retention, resist keeping raw 1s-interval data longer than a week; downsample aggressively and accept that you're storing summaries, not events.

**Data:** TSDBs are terrible event stores. If you're storing JSON blobs, audit logs, or anything with unpredictable schema, you want an event store or document database instead. TSDBs shine at numeric metrics aggregated over time, full stop.

The practical decision point: if your dominant access pattern is "give me aggregated values over a time range," and writes are high-frequency and append-only, a TSDB will outperform Postgres by an order of magnitude on both ingest throughput and query speed.
