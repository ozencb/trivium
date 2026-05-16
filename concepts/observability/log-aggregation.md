---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Log Aggregation

When your system spans multiple services or instances, logs are born distributed — each process writes to its own stdout or file. Log aggregation is the pipeline that collects all of them into a single queryable store so you can reason about the system as a whole rather than interrogating individual processes.

### The Core Mechanism

The typical pipeline has three stages:

1. **Collection** — an agent runs close to the application (sidecar container, node-level DaemonSet, or host process) and reads logs from wherever the app writes them: stdout, a file, a Unix socket. Fluentd, Filebeat, and Vector are common here.
2. **Transport with buffering** — the agent ships logs to a central collector or directly to storage. The buffering layer matters: if the destination is slow or down, you want logs queued on disk rather than dropped. This is where backpressure handling lives.
3. **Indexing and storage** — the destination (Elasticsearch, Loki, Splunk, CloudWatch Logs) ingests, parses, and indexes the logs so queries across billions of lines remain fast.

The thing that makes this non-trivial is that you're dealing with a high-throughput, lossy-by-nature pipeline. Unlike a database write, a dropped log rarely surfaces as an error. You have to instrument the pipeline itself to know if you're losing data.

### Mental Model

Ten replicas of your API service are running. A user reports a 500 error. Without aggregation: you pick a pod, exec in, grep — wrong pod, try again. Repeat. With aggregation, every log line from every replica was tagged at collection time with `pod_name`, `namespace`, and `node`, then shipped to Loki. You query once:

```
{app="api"} |= "request_id=abc123"
```

You get the full trace across all replicas in one shot.

### Practical Scenarios

**Backend**: When you adopt structured logging (which you already know), aggregation is what makes those structured fields queryable at scale. The `user_id` field you emit becomes a filter across every service that touched that user's session — auth, payment, notification — without knowing which service to look in first.

**SRE**: During an incident, you need to correlate a spike in 5xx errors (from your API logs) with a sudden increase in query latency (from your database logs) at the same timestamp. Aggregation puts both streams in the same place so you can overlay them on a timeline rather than tab-switching between dashboards.

**DevOps**: The pipeline itself is infrastructure you own. Key decisions: agent-based vs. direct SDK shipping (agent gives you decoupling; SDK shipping reduces moving parts), retention tiers (hot storage for 7 days, cold for 90, delete after 1 year), and log volume spikes — a bad deploy that floods logs can overload your aggregation backend if you haven't tuned rate limiting or sampling at the collection layer.

The unsexy reality is that log aggregation costs money proportional to volume, so at scale you end up making deliberate choices about what to log at what verbosity levels — aggregation makes those tradeoffs visible and consequential.
