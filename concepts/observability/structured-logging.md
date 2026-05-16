---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

**Structured Logging** is the practice of emitting log entries as machine-parseable data (typically JSON) rather than freeform strings — because logs you can query are worth exponentially more than logs you can only read.

## The core problem with unstructured logs

Traditional logging looks like:

```
[2026-05-16 14:32:01] ERROR: Failed to process order 8842 for user 991 - timeout after 3000ms
```

This is readable to a human scanning a terminal. It's nearly useless at scale. To find all timeouts over 2000ms for a specific service, you're writing fragile regex against inconsistent string formats across thousands of machines.

Structured logging flips the model: instead of formatting data *into* a string, you emit the data *as* data.

```json
{
  "timestamp": "2026-05-16T14:32:01Z",
  "level": "error",
  "event": "order_processing_failed",
  "order_id": 8842,
  "user_id": 991,
  "error": "timeout",
  "duration_ms": 3000,
  "service": "checkout"
}
```

Now every field is queryable, filterable, and aggregatable without string parsing. Your log aggregation system (Datadog, Loki, CloudWatch Insights, etc.) ingests these directly as structured records.

## The mechanism

The key shift is treating log lines as **events with attributes** rather than messages. You define a schema per event type (implicitly or explicitly), and every field has a name and typed value. Libraries like `structlog` (Python), `zerolog`/`zap` (Go), or `winston` with JSON transport (Node) make this the default output format.

A good structured log entry answers: *what happened, when, where, to what, with what outcome, and how long did it take.*

## Practical scenarios

**Backend:** You're debugging why 0.3% of payments fail. With structured logs, you query `event=payment_failed AND gateway=stripe AND error_code=card_declined` and immediately see they cluster around a specific card BIN range. With unstructured logs, you're `grep`-ing and manually correlating.

**SRE:** You're oncall and latency spikes. Structured logs let you run `p99 of duration_ms grouped by endpoint` directly in your log query tool — no need to ship metrics for every possible dimension you might care about during an incident.

**Fullstack:** Your API returns 500s intermittently. Structured logs with a `trace_id` field (set at request ingress and passed through every log call) let you reconstruct the exact chain of events for a single bad request across five microservices — something impossible with freeform strings.

## The practical discipline

The value compounds when you're *consistent*: same field names across services (`user_id` not `userId` in one place and `uid` in another), same severity semantics, and always including context fields (request ID, service name, environment). That consistency is what makes Log Aggregation — collecting logs centrally and querying across them — actually work.
