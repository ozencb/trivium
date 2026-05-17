---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Log Aggregation

When you have more than a handful of services, logs scattered across dozens of machines become useless during an incident — you need them in one place, indexed, and queryable before the on-call engineer gives up and starts guessing. Log aggregation is the pipeline that makes that possible: shippers (Filebeat, Fluentd, Vector) tail log files or consume stdout, parse and enrich the events, then ship them to a centralized store (Elasticsearch, Loki, Splunk, CloudWatch Logs) where you can query across every service simultaneously.

**The core mechanism**

The pipeline has three stages: collect, transform, route. The collector runs as a sidecar or daemon on each host and reads log streams. The transform step is where structured logging pays off — if your app emits JSON, the shipper can extract fields like `service`, `trace_id`, `level`, and `user_id` into first-class indexed columns. If it emits plaintext, you're writing regex grok patterns at 3am, which is miserable. The router sends events to the right destination — maybe errors go to an alerting system, audit logs go to cold storage, and everything else goes to the main index.

**Mental model**

Think of it like database replication but for logs. Each service is a write-ahead log producing append-only events. The shipper is a replication slot reading from that log. The central store is the replica you actually query. The key insight: you're not changing how apps log, you're building infrastructure around the output they already produce.

**Where this matters in practice**

*Backend:* A request spans auth service → API gateway → three downstream services. Without aggregation, tracing a failure means SSH-ing into each box and grepping separately. With aggregation, you filter on `trace_id` and see the full causal chain in one query. This is the practical prerequisite for distributed tracing — logs give you the narrative when spans don't tell the whole story.

*SRE:* Aggregated logs become the input for alerting on error rate spikes, anomaly detection, and SLO burn rate calculations. Loki + Grafana lets you alert on `rate({service="payment"} |= "ERROR")` without storing every log field as a metric. The failure mode to watch: high-cardinality fields (like raw user IDs) in indexed positions kill query performance and balloon storage costs.

*DevOps:* Log aggregation is where retention policy meets compliance. You want 7-day hot storage in Elasticsearch for fast incident queries, 90-day warm storage for audits, and compressed cold storage in S3 for legal holds. The pipeline needs to route and transform based on log classification — not every log deserves the same treatment or cost profile.

**Common pitfall:** teams treat the shipper as a dumb forwarder and do all parsing at query time. This burns CPU on every query. Parse and enrich at ingest — it's cheaper at scale and makes dashboards fast.
